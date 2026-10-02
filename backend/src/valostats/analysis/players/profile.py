"""Individual profile: a squad player against same-elo opponents and top ranked players on the same agents."""

from collections import Counter
from collections.abc import Mapping, Sequence

from valostats.analysis.players import breakdowns
from valostats.analysis.players.benchmark import AgentBenchmark, mixed_benchmark
from valostats.analysis.players.metrics import STATS, StatAccumulator
from valostats.analysis.team.duel_maps import duel_map
from valostats.constants.analysis import LEAD_P_VALUE, MIN_MAP_MATCHES, MIN_PLAYER_ROUNDS
from valostats.constants.labels import SIDE_LABELS
from valostats.domain.enums import Cohort, Tone
from valostats.domain.facts import PlayerMatchFact, PlayerRoundFact
from valostats.domain.maps import GameMap
from valostats.schemas.common import Rate
from valostats.schemas.period.player import (
    AgentShare,
    HeadlineValue,
    PlayerHeadline,
    PlayerProfile,
    StatComparison,
    StatGap,
)

MAX_AGENTS_SHOWN = 4
MAX_GAPS = 5


def player_profile(
    puuid: str,
    comparison_label: str,
    rows: Sequence[PlayerRoundFact],
    opponent_rows: Sequence[PlayerRoundFact],
    previous_rows: Sequence[PlayerRoundFact],
    player_matches: Sequence[PlayerMatchFact],
    top_by_agent: AgentBenchmark,
    top_player_matches: Sequence[PlayerMatchFact],
    top_weapons: Mapping[str, float],
    maps: Mapping[str, GameMap],
) -> PlayerProfile:
    """`rows` are the player's rounds in the period, `opponent_rows` every opponent round of the period."""
    acc, opponents = StatAccumulator(rows), StatAccumulator(opponent_rows)
    top = mixed_benchmark(rows, top_by_agent)
    previous = StatAccumulator(previous_rows) if len(previous_rows) >= MIN_PLAYER_ROUNDS else None
    matches = {r.match_id for r in rows}
    wins = len({r.match_id for r in rows if r.match_won})
    stats, gaps = _compare(acc, opponents, top)
    strengths, weaknesses = _strongest_gaps(gaps)

    return PlayerProfile(
        puuid=puuid,
        name=rows[-1].name,
        comparison_label=comparison_label,
        matches=len(matches),
        wins=wins,
        losses=len(matches) - wins,
        rounds=len(rows),
        agents=[
            AgentShare(agent=a, share=Rate(count=n, total=len(rows)))
            for a, n in Counter(r.agent for r in rows).most_common(MAX_AGENTS_SHOWN)
        ],
        headline=_headline(rows, acc, previous),
        strengths=strengths,
        weaknesses=weaknesses,
        stats=stats,
        form=breakdowns.form(rows),
        top_reference_acs=top.get("acs"),
        round_impact=breakdowns.round_impact(rows),
        by_side=breakdowns.split_rows(rows, lambda r: SIDE_LABELS[r.side], with_matches=False),
        by_agent=breakdowns.split_rows(rows, lambda r: r.agent),
        by_map=breakdowns.split_rows(rows, lambda r: r.map_name),
        weapons=breakdowns.weapons(rows, top_weapons),
        death_spots=breakdowns.death_spots(rows),
        clutches=breakdowns.clutches(rows),
        utility=breakdowns.utility(player_matches, top_player_matches),
        duel_maps=[
            duel_map(maps[map_name], None, [r for r in rows if r.map_name == map_name])
            for map_name, _ in Counter(r.map_name for r in rows).most_common()
            if len({r.match_id for r in rows if r.map_name == map_name}) >= MIN_MAP_MATCHES
        ],
    )


def _headline(rows: Sequence[PlayerRoundFact], acc: StatAccumulator, previous: StatAccumulator | None) -> PlayerHeadline:
    def value(key: str) -> HeadlineValue:
        return HeadlineValue(value=acc.mean(key), previous=previous.mean(key) if previous else None)

    return PlayerHeadline(
        acs=value("acs"),
        kd=breakdowns.kill_death_ratio(rows),
        adr=value("adr"),
        kast=value("kast"),
        headshots=value("hs"),
        first_bloods=sum(r.first_blood for r in rows),
        first_deaths=sum(r.first_death for r in rows),
        impact=value("impact"),
    )


def _compare(
    acc: StatAccumulator, opponents: StatAccumulator, top: Mapping[str, float | None]
) -> tuple[list[StatComparison], list[tuple[StatGap, float, float]]]:
    """Every stat next to both references, and the clear gaps with their p-value and relative size."""
    rows, gaps = [], []
    for stat in STATS:
        value = acc.mean(stat.key)
        tones = {}
        for group, reference in ((Cohort.OPPONENT, opponents.mean(stat.key)), (Cohort.TOP, top.get(stat.key))):
            p = acc.p_value(stat.key, reference)
            tones[group] = Tone.NEUTRAL
            if value is not None and reference is not None and p < LEAD_P_VALUE:
                tone = Tone.GOOD if (value > reference) == stat.higher_is_better else Tone.BAD
                tones[group] = tone
                gap = StatGap(key=stat.key, label=stat.label, value=value, reference=reference, reference_group=group, tone=tone)
                gaps.append((gap, p, abs(value - reference) / (abs(reference) or 1)))
        rows.append(
            StatComparison(
                key=stat.key,
                value=value,
                opponents=opponents.mean(stat.key),
                top=top.get(stat.key),
                versus_opponents=tones[Cohort.OPPONENT],
                versus_top=tones[Cohort.TOP],
            )
        )
    return rows, gaps


def _strongest_gaps(gaps: list[tuple[StatGap, float, float]]) -> tuple[list[StatGap], list[StatGap]]:
    """Most significant first, one gap per stat and direction."""
    strengths: list[StatGap] = []
    weaknesses: list[StatGap] = []
    seen: set[tuple[str, Tone]] = set()
    for gap, _, _ in sorted(gaps, key=lambda g: (g[1], -g[2])):
        if (gap.key, gap.tone) in seen:
            continue
        seen.add((gap.key, gap.tone))
        (strengths if gap.tone is Tone.GOOD else weaknesses).append(gap)
    return strengths[:MAX_GAPS], weaknesses[:MAX_GAPS]
