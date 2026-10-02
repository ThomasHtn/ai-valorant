"""Squad vs opponents of the same matches: every metric, on every map and side, then for each player.

Each comparison is a statistical test. Gaps that survive the Benjamini-Hochberg correction are
"confirmed"; other gaps with p < 0.05 are shown as "leads". The top ranked rate on the same scope
rides along as a second, untested reference: what the leaderboard does in the same spot.
"""

from collections import Counter
from collections.abc import Callable, Sequence
from dataclasses import dataclass, field
from typing import Any

from valostats.analysis.period.metrics import (
    DEATH_METRICS,
    OPENING_DUELS_COUNTED,
    OPENING_DUELS_LABEL,
    OPENING_DUELS_OPPOSITE,
    OPENING_DUELS_TRIES,
    ROUND_METRICS,
    TRADED_DEATHS,
    ZERO_DAMAGE_DEATHS,
    Metric,
)
from valostats.analysis.period.reading import read_in_colour
from valostats.analysis.period.rewatch import latest_refs
from valostats.analysis.statistics.proportions import benjamini_hochberg, one_proportion, two_proportions
from valostats.constants.analysis import LEAD_P_VALUE, MAX_FINDINGS_PER_METRIC, MIN_COMPARISON_SAMPLE
from valostats.constants.labels import ALL_MAPS, SIDE_LABELS
from valostats.domain.enums import Cohort, FindingStatus, KillerCohort, Side, Tone
from valostats.domain.facts import DeathFact, RoundFact
from valostats.schemas.common import MatchLink, Rate
from valostats.schemas.period.findings import Finding, FindingMatch, TeamFindings


@dataclass(eq=False)
class ComparisonTest:
    scope: str
    map_name: str | None
    metric: Metric[Any]
    squad: Rate
    # None when the squad is tested against 50 %.
    opponents: Rate | None
    good: bool
    p: float
    effect: float
    # Squad rows on the wrong side of the metric, to rewatch.
    failures: list[Any]
    # Player name for per-player tests.
    player: str | None = None
    # Top ranked rate on the same scope; None without enough top ranked rows or when it is 50 % by construction.
    top: Rate | None = None
    # Squad figure in each match, by match id.
    by_match: dict[str, Rate] = field(default_factory=dict)


@dataclass
class FindingSet:
    tests: list[ComparisonTest]
    confirmed: set[int] = field(default_factory=set)
    # Confirmed first, then leads, largest gap first.
    shown: list[ComparisonTest] = field(default_factory=list)

    def status(self, test: ComparisonTest) -> FindingStatus:
        return FindingStatus.CONFIRMED if id(test) in self.confirmed else FindingStatus.LEAD


def find_gaps(
    rounds: Sequence[RoundFact],
    deaths: Sequence[DeathFact],
    top_rounds: Sequence[RoundFact] = (),
    top_deaths: Sequence[DeathFact] = (),
) -> FindingSet:
    """Run every comparison on the period's facts (deaths without teamkills) and rank the gaps."""
    tests = _scope_tests(rounds, deaths, top_rounds, top_deaths) + _player_tests(deaths, top_deaths)
    confirmed = {id(t) for t in benjamini_hochberg(tests, lambda t: t.p)}
    shown = [t for t in tests if id(t) in confirmed or t.p < LEAD_P_VALUE]
    shown.sort(key=lambda t: (id(t) not in confirmed, -t.effect))
    return FindingSet(tests, confirmed, shown)


def _scopes(maps: list[str]) -> list[tuple[str | None, Side | None, str]]:
    """(map, side, label) of every comparison scope."""
    scopes: list[tuple[str | None, Side | None, str]] = [
        (None, None, ALL_MAPS),
        (None, Side.ATTACK, "Attaque"),
        (None, Side.DEFENSE, "Défense"),
    ]
    scopes += [(m, None, m) for m in maps]
    scopes += [(m, s, f"{m} · {SIDE_LABELS[s]}") for m in maps for s in Side]
    return scopes


def _scope_tests(
    rounds: Sequence[RoundFact], deaths: Sequence[DeathFact], top_rounds: Sequence[RoundFact], top_deaths: Sequence[DeathFact]
) -> list[ComparisonTest]:
    tests: list[ComparisonTest] = []
    metrics: list[tuple[Metric[Any], Sequence[Any], Sequence[Any]]] = [(m, rounds, top_rounds) for m in ROUND_METRICS] + [
        (m, deaths, top_deaths) for m in DEATH_METRICS
    ]
    for map_name, side, label in _scopes(sorted({r.map_name for r in rounds})):
        for metric, rows, top_rows in metrics:
            if (metric.side and metric.side != side) or metric.mirror or (metric.both_sides and side):
                continue
            # A map without a side only carries the round win rate; side scopes say the rest more precisely.
            if map_name and side is None and not metric.both_sides:
                continue
            selected = [
                x for x in rows if (map_name is None or x.map_name == map_name) and (side is None or x.side == side) and metric.applies(x)
            ]
            squad = [x for x in selected if x.cohort is Cohort.SQUAD]
            opponents = [x for x in selected if x.cohort is Cohort.OPPONENT]
            test = _test(label, map_name, metric, squad, opponents)
            if test:
                # Over both sides, a won/lost split is 50 % for any pool of full matches.
                if not (metric.versus_half and side is None):
                    test.top = _top_rate(metric, [x for x in top_rows if _in_scope(x, map_name, side)])
                tests.append(test)
    return tests


def _in_scope(row: RoundFact | DeathFact, map_name: str | None, side: Side | None) -> bool:
    return (map_name is None or row.map_name == map_name) and (side is None or row.side == side)


def _top_rate(metric: Metric[Any], rows: Sequence[Any]) -> Rate | None:
    applied = [x for x in rows if metric.applies(x)]
    if len(applied) < MIN_COMPARISON_SAMPLE:
        return None
    return Rate(count=sum(bool(metric.success(x)) for x in applied), total=len(applied))


def _player_tests(deaths: Sequence[DeathFact], top_deaths: Sequence[DeathFact]) -> list[ComparisonTest]:
    tests: list[ComparisonTest] = []
    openings = [d for d in deaths if d.opening]
    opponent_deaths = [d for d in deaths if d.cohort is Cohort.OPPONENT]
    for name in sorted({d.name for d in deaths if d.cohort is Cohort.SQUAD}):
        duels: Metric[DeathFact] = Metric(
            "opening",
            OPENING_DUELS_LABEL,
            lambda d: True,
            _killed_by(name),
            True,
            "duels",
            opposite=OPENING_DUELS_OPPOSITE,
            counted=OPENING_DUELS_COUNTED,
            tries=OPENING_DUELS_TRIES,
        )
        involved = [d for d in openings if name in (d.name, d.killer)]
        own_deaths = [d for d in deaths if d.cohort is Cohort.SQUAD and d.name == name]
        candidates = [
            _test(name, None, duels, involved, openings, opponents_success=lambda d: d.killer_cohort is KillerCohort.OPPONENT, player=name),
            _test(name, None, TRADED_DEATHS, own_deaths, opponent_deaths, player=name),
            _test(name, None, ZERO_DAMAGE_DEATHS, own_deaths, opponent_deaths, player=name),
        ]
        for test in candidates:
            # An opening duel is won by one side and lost by the other: 50 % on the leaderboard too.
            if test and test.metric is not duels:
                test.top = _top_rate(test.metric, top_deaths)
        tests += [t for t in candidates if t]
    return tests


def _killed_by(name: str) -> Callable[[DeathFact], bool]:
    return lambda d: d.killer == name


def _test(
    scope: str,
    map_name: str | None,
    metric: Metric[Any],
    squad: list[Any],
    opponents: list[Any],
    opponents_success: Callable[[Any], bool] | None = None,
    player: str | None = None,
) -> ComparisonTest | None:
    k1, n1 = sum(bool(metric.success(x)) for x in squad), len(squad)
    if metric.versus_half:
        if n1 < MIN_COMPARISON_SAMPLE:
            return None
        opponent_rate, p, reference = None, one_proportion(k1, n1), 0.5
    else:
        success = opponents_success or metric.success
        k2, n2 = sum(bool(success(x)) for x in opponents), len(opponents)
        if n1 < MIN_COMPARISON_SAMPLE or n2 < MIN_COMPARISON_SAMPLE:
            return None
        opponent_rate, p, reference = Rate(count=k2, total=n2), two_proportions(k1, n1, k2, n2), k2 / n2
    return ComparisonTest(
        scope=scope,
        map_name=map_name,
        metric=metric,
        squad=Rate(count=k1, total=n1),
        opponents=opponent_rate,
        good=(k1 / n1 > reference) == metric.higher_is_better,
        p=p,
        effect=abs(k1 / n1 - reference),
        failures=[x for x in squad if bool(metric.success(x)) != metric.higher_is_better],
        player=player,
        by_match=rates_by_match(squad, metric.success),
    )


def rates_by_match(rows: Sequence[Any], success: Callable[[Any], bool]) -> dict[str, Rate]:
    """Successes over tries in each match the rows come from."""
    counts: dict[str, list[int]] = {}
    for row in rows:
        tally = counts.setdefault(row.match_id, [0, 0])
        tally[0] += bool(success(row))
        tally[1] += 1
    return {match_id: Rate(count=k, total=n) for match_id, (k, n) in counts.items()}


def finding_matches(by_match: dict[str, Rate], links: dict[str, MatchLink]) -> list[FindingMatch]:
    """The matches behind a figure, oldest first (`links` is ordered that way)."""
    return [FindingMatch(**link.model_dump(), rate=by_match[match_id]) for match_id, link in links.items() if match_id in by_match]


def to_finding(test: ComparisonTest, status: FindingStatus, links: dict[str, MatchLink]) -> Finding:
    reading = read_in_colour(test)
    return Finding(
        scope=test.scope,
        metric=test.metric.key,
        label=reading.label,
        tone=Tone.GOOD if test.good else Tone.BAD,
        status=status,
        inverted=reading.inverted,
        unit=test.metric.unit,
        counted=reading.counted,
        tries=reading.tries,
        squad=reading.squad,
        reference=reading.reference,
        top=reading.top,
        rewatch=[] if test.good else latest_refs(test.failures),
        matches=finding_matches(reading.by_match, links),
    )


def team_findings(findings: FindingSet, links: dict[str, MatchLink]) -> TeamFindings:
    return TeamFindings(
        weak_team=_team_list(findings, good=False, links=links),
        weak_players=_player_list(findings, good=False, links=links),
        strong_team=_team_list(findings, good=True, links=links),
        strong_players=_player_list(findings, good=True, links=links),
    )


def _team_list(findings: FindingSet, good: bool, links: dict[str, MatchLink]) -> list[Finding]:
    items, per_metric = [], Counter[str]()
    for test in findings.shown:
        # The same metric on many scopes would crowd the list: keep the strongest ones.
        if test.good == good and test.player is None and per_metric[test.metric.key] < MAX_FINDINGS_PER_METRIC:
            per_metric[test.metric.key] += 1
            items.append(to_finding(test, findings.status(test), links))
    return items


def _player_list(findings: FindingSet, good: bool, links: dict[str, MatchLink]) -> list[Finding]:
    """One row per player and metric, each with its own figure; the same metric stays grouped together."""
    by_metric: dict[str, list[ComparisonTest]] = {}
    for test in findings.shown:
        if test.good == good and test.player is not None:
            by_metric.setdefault(test.metric.key, []).append(test)
    return [to_finding(t, findings.status(t), links) for tests in by_metric.values() for t in tests]


def map_findings(findings: FindingSet, map_name: str, links: dict[str, MatchLink]) -> list[Finding]:
    """Team findings scoped to one map, good and bad."""
    return [to_finding(t, findings.status(t), links) for t in findings.shown if t.player is None and t.map_name == map_name]
