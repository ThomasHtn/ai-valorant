"""Sections of a player profile: splits by side / agent / map, weapons, death spots, clutches, utility."""

from collections import Counter, defaultdict
from collections.abc import Callable, Mapping, Sequence

from valostats.analysis.players.metrics import StatAccumulator
from valostats.analysis.statistics.rates import rate
from valostats.constants.analysis import EARLY_DEATH_MS
from valostats.domain.enums import Side
from valostats.domain.facts import PlayerMatchFact, PlayerRoundFact
from valostats.schemas.common import LabelledRate, Rate
from valostats.schemas.period.player import (
    AbilityUse,
    ClutchSummary,
    DeathSpotRow,
    PlayerFormPoint,
    RoundImpact,
    SplitRow,
    UtilityRow,
    WeaponRow,
)

MAX_WEAPONS = 8
MAX_DEATH_SPOTS = 14
SPOTS_PER_MAP_SIDE = 2
MIN_SPOT_DEATHS = 4
# Utility flag: used less than this share of the top ranked usage, with enough rounds on the agent.
UNDER_USE_RATIO = 0.7
UNDER_USE_MIN_TOP_PER_ROUND = 0.1
UNDER_USE_MIN_ROUNDS = 100
ABILITIES: list[tuple[str, Callable[[PlayerMatchFact], int]]] = [
    ("C", lambda m: m.grenade_casts),
    ("Q", lambda m: m.ability1_casts),
    ("E", lambda m: m.ability2_casts),
    ("X", lambda m: m.ultimate_casts),
]


def kill_death_ratio(rows: Sequence[PlayerRoundFact]) -> float | None:
    deaths = sum(r.deaths for r in rows)
    return sum(r.kills for r in rows) / deaths if deaths else None


def split_rows(rows: Sequence[PlayerRoundFact], key: Callable[[PlayerRoundFact], str], with_matches: bool = True) -> list[SplitRow]:
    """Key stats per group, largest group first."""
    groups: defaultdict[str, list[PlayerRoundFact]] = defaultdict(list)
    for r in rows:
        groups[key(r)].append(r)
    out = []
    for label, rs in sorted(groups.items(), key=lambda kv: -len(kv[1])):
        acc = StatAccumulator(rs)
        matches = {r.match_id for r in rs}
        wins = len({r.match_id for r in rs if r.match_won})
        out.append(
            SplitRow(
                label=label,
                matches=len(matches) if with_matches else None,
                wins=wins if with_matches else None,
                losses=len(matches) - wins if with_matches else None,
                rounds=len(rs),
                acs=acc.mean("acs"),
                kd=kill_death_ratio(rs),
                adr=acc.mean("adr"),
                kast=acc.mean("kast"),
                first_bloods=sum(r.first_blood for r in rs),
                first_deaths=sum(r.first_death for r in rs),
                impact=acc.mean("impact"),
            )
        )
    return out


def form(rows: Sequence[PlayerRoundFact]) -> list[PlayerFormPoint]:
    """ACS in each match, oldest first."""
    per_match: defaultdict[str, list[PlayerRoundFact]] = defaultdict(list)
    for r in rows:
        per_match[r.match_id].append(r)
    points = []
    for match_id, rs in sorted(per_match.items(), key=lambda kv: kv[1][0].started_at):
        points.append(
            PlayerFormPoint(
                match_id=match_id,
                started_at=rs[0].started_at,
                map_name=rs[0].map_name,
                agent=rs[0].agent,
                acs=sum(r.score for r in rs) / len(rs),
                kills=sum(r.kills for r in rs),
                deaths=sum(r.deaths for r in rs),
            )
        )
    return points


def round_impact(rows: Sequence[PlayerRoundFact]) -> RoundImpact:
    cases: list[tuple[str, Callable[[PlayerRoundFact], bool]]] = [
        ("Fait le first blood", lambda r: r.first_blood),
        ("Subit la first death", lambda r: r.first_death),
        ("Fait 2 kills ou plus", lambda r: r.kills >= 2),
        ("Ne fait aucun kill", lambda r: r.kills == 0),
        ("Meurt à 0 dégât", lambda r: r.zero_damage_death),
        ("Survit au round", lambda r: r.survived),
        ("Prend une revenge", lambda r: r.revenge_given > 0),
    ]
    return RoundImpact(
        baseline=rate(rows, lambda r: r.won),
        rows=[LabelledRate(label=label, rate=rate((r for r in rows if condition(r)), lambda r: r.won)) for label, condition in cases],
    )


def weapons(rows: Sequence[PlayerRoundFact], top_weapons: Mapping[str, float]) -> list[WeaponRow]:
    """Main weapon bought or picked up at the start of the round, most used first."""
    groups: defaultdict[str, list[PlayerRoundFact]] = defaultdict(list)
    for r in rows:
        if r.weapon:
            groups[r.weapon].append(r)
    return [
        WeaponRow(
            weapon=weapon,
            rounds=len(rs),
            kills_per_round=sum(r.kills for r in rs) / len(rs),
            top_kills_per_round=top_weapons.get(weapon) or None,
            adr=sum(r.damage for r in rs) / len(rs),
            rounds_won=rate(rs, lambda r: r.won),
        )
        for weapon, rs in sorted(groups.items(), key=lambda kv: -len(kv[1]))[:MAX_WEAPONS]
    ]


def death_spots(rows: Sequence[PlayerRoundFact]) -> list[DeathSpotRow]:
    """Callouts where the player dies most, per map and side (at least 4 deaths)."""
    groups: defaultdict[tuple[str, Side], list[PlayerRoundFact]] = defaultdict(list)
    for r in rows:
        if r.death_callout:
            groups[(r.map_name, r.side)].append(r)
    out = []
    for (map_name, side), rs in sorted(groups.items(), key=lambda kv: -len(kv[1])):
        for callout, n in Counter(r.death_callout for r in rs).most_common(SPOTS_PER_MAP_SIDE):
            if n >= MIN_SPOT_DEATHS and callout:
                early = sum(1 for r in rs if r.death_callout == callout and r.death_ms is not None and r.death_ms < EARLY_DEATH_MS)
                out.append(
                    DeathSpotRow(
                        map_name=map_name,
                        side=side,
                        callout=callout,
                        deaths=n,
                        share=Rate(count=n, total=len(rs)),
                        early=Rate(count=early, total=n),
                    )
                )
    return out[:MAX_DEATH_SPOTS]


def clutches(rows: Sequence[PlayerRoundFact]) -> ClutchSummary:
    return ClutchSummary(
        versus=[rate((r for r in rows if r.clutch_versus == n), lambda r: r.clutch_won) for n in range(1, 6)],
        total_up_to_three=rate((r for r in rows if 1 <= r.clutch_versus <= 3), lambda r: r.clutch_won),
    )


def utility(player_matches: Sequence[PlayerMatchFact], top_player_matches: Sequence[PlayerMatchFact]) -> list[UtilityRow]:
    """Ability casts per round by agent, against top ranked players on the same agent."""
    by_agent: defaultdict[str, list[PlayerMatchFact]] = defaultdict(list)
    for m in player_matches:
        by_agent[m.agent].append(m)
    top_by_agent: defaultdict[str, list[PlayerMatchFact]] = defaultdict(list)
    for m in top_player_matches:
        top_by_agent[m.agent].append(m)
    rows = []
    for agent, matches in sorted(by_agent.items(), key=lambda kv: -len(kv[1])):
        rounds = sum(m.rounds for m in matches)
        top = top_by_agent.get(agent, [])
        top_rounds = sum(m.rounds for m in top)
        abilities = []
        for ability, casts in ABILITIES:
            mine = sum(casts(m) for m in matches) / rounds if rounds else 0.0
            reference = sum(casts(m) for m in top) / top_rounds if top_rounds else None
            under_used = (
                reference is not None
                and reference >= UNDER_USE_MIN_TOP_PER_ROUND
                and mine < UNDER_USE_RATIO * reference
                and rounds >= UNDER_USE_MIN_ROUNDS
            )
            abilities.append(AbilityUse(ability=ability, per_round=mine, top_per_round=reference, under_used=under_used))
        rows.append(UtilityRow(agent=agent, matches=len(matches), abilities=abilities))
    return rows
