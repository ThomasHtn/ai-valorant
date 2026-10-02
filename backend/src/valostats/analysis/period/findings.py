"""Squad vs opponents of the same matches: every metric, on every map and side, then for each player.

Each comparison is a statistical test. Gaps that survive the Benjamini-Hochberg correction are
"confirmed"; other gaps with p < 0.05 are shown as "leads".
"""

from collections import Counter
from collections.abc import Callable, Sequence
from dataclasses import dataclass, field
from typing import Any

from valostats.analysis.period.metrics import DEATH_METRICS, OPENING_DUELS_LABEL, ROUND_METRICS, TRADED_DEATHS, ZERO_DAMAGE_DEATHS, Metric
from valostats.analysis.period.rewatch import latest_refs
from valostats.analysis.statistics.proportions import benjamini_hochberg, one_proportion, two_proportions
from valostats.constants.analysis import LEAD_P_VALUE, MAX_FINDINGS_PER_METRIC, MIN_COMPARISON_SAMPLE
from valostats.constants.labels import ALL_MAPS, SIDE_LABELS
from valostats.domain.enums import Cohort, FindingStatus, KillerCohort, Side, Tone
from valostats.domain.facts import DeathFact, RoundFact
from valostats.schemas.common import Rate
from valostats.schemas.period.findings import Finding, FindingPlayer, TeamFindings


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


@dataclass
class FindingSet:
    tests: list[ComparisonTest]
    confirmed: set[int] = field(default_factory=set)
    # Confirmed first, then leads, largest gap first.
    shown: list[ComparisonTest] = field(default_factory=list)

    def status(self, test: ComparisonTest) -> FindingStatus:
        return FindingStatus.CONFIRMED if id(test) in self.confirmed else FindingStatus.LEAD


def find_gaps(rounds: Sequence[RoundFact], deaths: Sequence[DeathFact]) -> FindingSet:
    """Run every comparison on the period's facts (deaths without teamkills) and rank the gaps."""
    tests = _scope_tests(rounds, deaths) + _player_tests(deaths)
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


def _scope_tests(rounds: Sequence[RoundFact], deaths: Sequence[DeathFact]) -> list[ComparisonTest]:
    tests: list[ComparisonTest] = []
    metrics: list[tuple[Metric[Any], Sequence[Any]]] = [(m, rounds) for m in ROUND_METRICS] + [(m, deaths) for m in DEATH_METRICS]
    for map_name, side, label in _scopes(sorted({r.map_name for r in rounds})):
        for metric, rows in metrics:
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
                tests.append(test)
    return tests


def _player_tests(deaths: Sequence[DeathFact]) -> list[ComparisonTest]:
    tests: list[ComparisonTest] = []
    openings = [d for d in deaths if d.opening]
    opponent_deaths = [d for d in deaths if d.cohort is Cohort.OPPONENT]
    for name in sorted({d.name for d in deaths if d.cohort is Cohort.SQUAD}):
        duels: Metric[DeathFact] = Metric("opening", OPENING_DUELS_LABEL, lambda d: True, _killed_by(name), True, "duels")
        involved = [d for d in openings if name in (d.name, d.killer)]
        own_deaths = [d for d in deaths if d.cohort is Cohort.SQUAD and d.name == name]
        candidates = [
            _test(name, None, duels, involved, openings, opponents_success=lambda d: d.killer_cohort is KillerCohort.OPPONENT, player=name),
            _test(name, None, TRADED_DEATHS, own_deaths, opponent_deaths, player=name),
            _test(name, None, ZERO_DAMAGE_DEATHS, own_deaths, opponent_deaths, player=name),
        ]
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
    )


def to_finding(test: ComparisonTest, status: FindingStatus) -> Finding:
    return Finding(
        scope=test.scope,
        metric=test.metric.key,
        label=test.metric.label,
        tone=Tone.GOOD if test.good else Tone.BAD,
        status=status,
        unit=test.metric.unit,
        squad=test.squad,
        reference=test.opponents,
        players=[],
        rewatch=[] if test.good else latest_refs(test.failures),
    )


def _grouped_finding(tests: list[ComparisonTest], good: bool, findings: FindingSet) -> Finding:
    """Several players sharing the same point, in one finding."""
    statuses = {findings.status(t) for t in tests}
    return Finding(
        scope=None,
        metric=tests[0].metric.key,
        label=tests[0].metric.label,
        tone=Tone.GOOD if good else Tone.BAD,
        status=statuses.pop() if len(statuses) == 1 else FindingStatus.MIXED,
        unit=tests[0].metric.unit,
        squad=None,
        reference=tests[0].opponents,
        players=[FindingPlayer(name=t.player or "", rate=t.squad, rewatch=[] if good else latest_refs(t.failures)) for t in tests],
        rewatch=[],
    )


def team_findings(findings: FindingSet) -> TeamFindings:
    return TeamFindings(
        weak_team=_team_list(findings, good=False),
        weak_players=_player_list(findings, good=False),
        strong_team=_team_list(findings, good=True),
        strong_players=_player_list(findings, good=True),
    )


def _team_list(findings: FindingSet, good: bool) -> list[Finding]:
    items, per_metric = [], Counter[str]()
    for test in findings.shown:
        # The same metric on many scopes would crowd the list: keep the strongest ones.
        if test.good == good and test.player is None and per_metric[test.metric.key] < MAX_FINDINGS_PER_METRIC:
            per_metric[test.metric.key] += 1
            items.append(to_finding(test, findings.status(test)))
    return items


def _player_list(findings: FindingSet, good: bool) -> list[Finding]:
    by_metric: dict[str, list[ComparisonTest]] = {}
    for test in findings.shown:
        if test.good == good and test.player is not None:
            by_metric.setdefault(test.metric.key, []).append(test)
    return [
        to_finding(tests[0], findings.status(tests[0])) if len(tests) == 1 else _grouped_finding(tests, good, findings)
        for tests in by_metric.values()
    ]


def map_findings(findings: FindingSet, map_name: str) -> list[Finding]:
    """Team findings scoped to one map, good and bad."""
    return [to_finding(t, findings.status(t)) for t in findings.shown if t.player is None and t.map_name == map_name]
