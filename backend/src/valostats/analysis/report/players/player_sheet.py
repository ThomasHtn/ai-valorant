"""Player sheet: headline band, results by map / agent / side, weapons, economy, utility, death zones, duels, clutches, rounds to rewatch.

References follow the player rule of `cells.player_cell`: top ranked and opponents are players of the
same main role, history is the player himself before the period. Agent rows compare with every
player of that agent instead. Weapons and economy are set beside top ranked players of the same role.
"""

import statistics
from collections import Counter, defaultdict
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from typing import Any

from valostats.analysis.report.domains._lookups import TeamRounds, measured_cell
from valostats.analysis.report.domains.economy import HABITS, MIN_HABIT_SAMPLE, habit_metrics, non_pistol_player_facts
from valostats.analysis.report.domains.utility import casts_table
from valostats.analysis.report.foundation.art import agent_art, map_art
from valostats.analysis.report.foundation.cells import cell, fixed, player_cell, ratio
from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohort, ReportCohorts, SquadPlayer
from valostats.analysis.report.foundation.kill_roles import killer_agent
from valostats.analysis.report.foundation.player_metrics import (
    acs,
    adr,
    first_deaths_per_round,
    headshot_rate,
    kast,
    kd,
    opening_duels_won,
    rounds_won,
    won_after_first_blood,
    won_after_first_death,
)
from valostats.analysis.report.foundation.table_builder import TableBuilder
from valostats.analysis.report.players.headline import headline
from valostats.analysis.report.players.situations import player_situations
from valostats.constants.agents import role_of
from valostats.constants.game import UNITS_PER_METRE
from valostats.constants.players import DEATH_ZONES, REWATCH_ROUNDS, TOP_WEAPONS
from valostats.constants.report import MIN_PLAYER_SAMPLE
from valostats.core.errors import NotFoundError
from valostats.domain.enums import Reference, Side
from valostats.domain.facts import KillFact, PlayerMatchFact, PlayerRoundFact
from valostats.schemas.report.player import (
    AgentPlayed,
    ClutchLine,
    DeathZone,
    HeadlineStat,
    OpeningDuels,
    PlayerSheet,
    PlayerSummary,
    RewatchRound,
    WeaponUse,
    ZoneDeath,
)
from valostats.schemas.report.tables import GameArt, StatTable, ValueFormat

RoundFilter = Callable[[PlayerRoundFact], bool]
SIDE_LABELS = {Side.ATTACK: "Attaque", Side.DEFENSE: "Défense"}
MS_PER_SECOND = 1000

# Clutch sizes of the sheet: label and the opponents left when the player was alone.
CLUTCHES: tuple[tuple[str, Callable[[int], bool]], ...] = (
    ("1v1", lambda n: n == 1),
    ("1v2", lambda n: n == 2),
    ("1v3+", lambda n: n >= 3),
)


def player_summaries(cohorts: ReportCohorts) -> list[PlayerSummary]:
    """Squad players of the period, alphabetical, with their latest rank."""
    return [_summary(cohorts, p) for p in cohorts.players()]


def player_sheet(cohorts: ReportCohorts, name: str) -> PlayerSheet:
    """The sheet of one squad player of the period; NotFoundError for anyone else."""
    player = cohorts.player(name)
    if player is None:
        raise NotFoundError(f"{name} did not play with the squad in this period.")
    summary = _summary(cohorts, player)
    played = Counter(p.agent for p in _own_matches(cohorts, player))
    rounds = _own_rounds(cohorts, player)
    return PlayerSheet(
        **summary.model_dump(),
        agents=[AgentPlayed(agent=a, matches=n) for a, n in played.most_common()],
        headline=headline(cohorts, player),
        by_map=_split_table(cohorts, player, "maps", "Par carte", "Carte", _map_rows(cohorts, player)),
        by_agent=_split_table(cohorts, player, "agents", "Par agent", "Agent", _agent_rows(played), by_agent=True),
        by_side=_split_table(cohorts, player, "sides", "Par side", "Side", _side_rows(), record=False),
        weapons=_weapons(cohorts, player),
        economy=_economy(cohorts, player),
        utility=casts_table(cohorts, [player]),
        death_zones=_death_zones(cohorts, player),
        opening_duels=OpeningDuels(
            first_bloods=sum(r.first_blood for r in rounds),
            first_deaths=sum(r.first_death for r in rounds),
            duels_won=player_cell(cohorts, FactKind.PLAYER_ROUNDS, opening_duels_won, player),
            won_after_first_blood=player_cell(cohorts, FactKind.PLAYER_ROUNDS, won_after_first_blood, player),
            won_after_first_death=player_cell(cohorts, FactKind.PLAYER_ROUNDS, won_after_first_death, player),
        ),
        clutches=[_clutch(cohorts, player, label, size) for label, size in CLUTCHES],
        rewatch=_rewatch(cohorts, player),
        situations=player_situations(cohorts, player),
    )


def _own_matches(cohorts: ReportCohorts, player: SquadPlayer) -> list[PlayerMatchFact]:
    return [p for p in cohorts.squad(FactKind.PLAYER_MATCHES) if p.name == player.name]


def _own_rounds(cohorts: ReportCohorts, player: SquadPlayer) -> list[PlayerRoundFact]:
    return [r for r in cohorts.squad(FactKind.PLAYER_ROUNDS) if r.name == player.name]


def _summary(cohorts: ReportCohorts, player: SquadPlayer) -> PlayerSummary:
    matches = sorted(_own_matches(cohorts, player), key=lambda p: p.started_at)
    ranked = [p for p in matches if p.tier_name]
    return PlayerSummary(
        name=player.name,
        puuid=player.puuid,
        portrait=player.portrait,
        role=player.role,
        rank=ranked[-1].tier_name if ranked else None,
        matches=len(matches),
        rounds=len(_own_rounds(cohorts, player)),
    )


# A split row: key, label, picture, and the fields the player-rounds of the row share (map, agent or side).
SplitRow = tuple[str, str, GameArt | None, dict[str, Any]]


def _map_rows(cohorts: ReportCohorts, player: SquadPlayer) -> list[SplitRow]:
    maps = sorted({p.map_name for p in _own_matches(cohorts, player)})
    return [(m, m, map_art(m), {"map_name": m}) for m in maps]


def _agent_rows(played: Counter[str]) -> list[SplitRow]:
    return [(a, a, agent_art(a), {"agent": a}) for a, _ in sorted(played.items(), key=lambda x: (-x[1], x[0]))]


def _side_rows() -> list[SplitRow]:
    return [(side.value, SIDE_LABELS[side], None, {"side": side}) for side in Side]


def _split_table(
    cohorts: ReportCohorts,
    player: SquadPlayer,
    suffix: str,
    title: str,
    rows_label: str,
    rows: Sequence[SplitRow],
    *,
    by_agent: bool = False,
    record: bool = True,
) -> StatTable:
    """Results of the player on each map, agent or side.

    Top and opp references are players of his role on the same map or side; on an agent row, every
    player of that agent. The row fields are equality filters, so every reference is an index lookup.
    Without `record` (sides), matches and V-D give way to rounds played: both sides share every match.
    """
    table = TableBuilder(f"player-{suffix}", title, rows_label)
    if record:
        table.count_column("matches", "Matchs").record_column()
    else:
        table.count_column("rounds", "Rounds")
    (
        table.column("rw", "Rounds gagnés", help="roundsWon", min=MIN_PLAYER_SAMPLE, ref=Reference.HISTORY)
        .column("acs", "ACS", ValueFormat.INTEGER, help="acs", min=MIN_PLAYER_SAMPLE)
        .column("kd", "K/D", ValueFormat.DECIMAL_2, help="kd", min=MIN_PLAYER_SAMPLE)
        .column("adr", "ADR", ValueFormat.INTEGER, help="adr", min=MIN_PLAYER_SAMPLE)
        .column("kast", "KAST", help="kast", min=MIN_PLAYER_SAMPLE)
        .column("fd", "First deaths par round", ValueFormat.DECIMAL_2, -1, help="fdPerRound", min=MIN_PLAYER_SAMPLE)
    )
    metrics = {"rw": rounds_won, "acs": acs, "kd": kd, "adr": adr, "kast": kast, "fd": first_deaths_per_round}
    same_role: RoundFilter = (lambda r: True) if by_agent else (lambda r: role_of(r.agent) == player.role)
    for key, label, art, equal in rows:
        rounds = [r for r in _own_rounds(cohorts, player) if all(getattr(r, f) == v for f, v in equal.items())]
        matches = {r.match_id for r in rounds}
        wins = len({r.match_id for r in rounds if r.match_won})
        cells = (
            {"matches": fixed(len(matches)), "wl": fixed(f"{wins}-{len(matches) - wins}", len(matches))}
            if record
            else {"rounds": fixed(len(rounds))}
        )
        for column, metric in metrics.items():
            cells[column] = cell(
                cohorts, FactKind.PLAYER_ROUNDS, metric, where=lambda r: r.name == player.name, reference_where=same_role, **equal
            )
        table.row(key, label, cells, art=art)
    return table.build()


def _weapons(cohorts: ReportCohorts, player: SquadPlayer) -> list[WeaponUse]:
    kills: list[KillFact] = list(cohorts.squad(FactKind.KILLS, killer=player.name))
    counts = Counter(k.weapon for k in kills if k.weapon)
    rounds = _own_rounds(cohorts, player)
    top_kills = [
        k for k in cohorts.select(FactKind.KILLS, ReportCohort.TOP) if cohorts.role_of_player(k.match_id, k.killer_puuid) == player.role
    ]
    top_rounds = [r for r in cohorts.select(FactKind.PLAYER_ROUNDS, ReportCohort.TOP) if role_of(r.agent) == player.role]
    out = []
    for weapon, n in counts.most_common(TOP_WEAPONS):
        top = _weapon_figures(top_kills, top_rounds, weapon)
        own = _weapon_figures(kills, rounds, weapon)
        out.append(
            WeaponUse(
                weapon=weapon,
                kills=n,
                share=own.share or 0.0,
                headshot_rate=own.headshot_rate,
                shots=own.shots,
                distance=own.distance,
                top_share=top.share,
                top_headshot_rate=top.headshot_rate,
                top_distance=top.distance,
            )
        )
    return out


@dataclass(frozen=True)
class _WeaponFigures:
    share: float | None
    headshot_rate: float | None
    shots: int
    distance: float | None


def _weapon_figures(kills: Sequence[KillFact], rounds: Sequence[PlayerRoundFact], weapon: str) -> _WeaponFigures:
    """Share of the kills made with the weapon, headshot rate in the rounds it was bought, median kill distance."""
    hits, shots = headshot_rate([r for r in rounds if r.weapon == weapon])
    with_weapon = [k for k in kills if k.weapon == weapon]
    distances = [k.distance / UNITS_PER_METRE for k in with_weapon if k.distance is not None]
    return _WeaponFigures(
        share=round(len(with_weapon) / len(kills), 4) if kills else None,
        headshot_rate=round(hits, 4) if hits is not None else None,
        shots=shots,
        distance=round(statistics.median(distances), 1) if distances else None,
    )


def _economy(cohorts: ReportCohorts, player: SquadPlayer) -> list[HeadlineStat]:
    """Buying habits outside pistols, the same figures as the Économie table, for this player."""
    metrics = habit_metrics(TeamRounds(cohorts))
    facts = non_pistol_player_facts(cohorts, player, {})
    return [
        HeadlineStat(
            key=key,
            label=label,
            format=value_format,
            better=better,
            help=help_key,
            unit="rounds",
            min=MIN_HABIT_SAMPLE,
            cell=measured_cell(metrics[key], facts),
        )
        for key, label, value_format, better, help_key in HABITS
    ]


def _death_zones(cohorts: ReportCohorts, player: SquadPlayer) -> list[DeathZone]:
    """Zones where the player dies most, each with a rate per 100 rounds on that map beside top ranked of his role."""
    deaths: list[KillFact] = list(cohorts.squad(FactKind.DEATHS, victim=player.name))
    by_zone: defaultdict[tuple[str, str], list[KillFact]] = defaultdict(list)
    for death in deaths:
        by_zone[(death.map_name, death.victim_zone)].append(death)
    zones = sorted(by_zone.items(), key=lambda x: (-len(x[1]), x[0]))[:DEATH_ZONES]
    played = Counter(r.map_name for r in _own_rounds(cohorts, player))
    out = []
    for (map_name, zone), group in zones:
        group.sort(key=lambda k: (k.started_at, k.round_index, k.ms))
        first = sum(k.opening for k in group)
        rounds = played[map_name]
        out.append(
            DeathZone(
                map_name=map_name,
                zone=zone,
                deaths=len(group),
                share=round(len(group) / len(deaths), 4),
                first_deaths=first,
                first_death_share=round(first / len(group), 4),
                rounds_played=rounds,
                per_100_rounds=round(len(group) / rounds * 100, 1) if rounds else None,
                top_per_100_rounds=_top_zone_rate(cohorts, player.role, map_name, zone),
                rounds=[ZoneDeath(**_round_ref(k), side=k.victim_side, first_death=k.opening) for k in group],
            )
        )
    return out


def _top_zone_rate(cohorts: ReportCohorts, role: str, map_name: str, zone: str) -> float | None:
    """Deaths in the zone per 100 rounds played on the map, for top ranked players of the same role."""
    rounds = sum(1 for r in cohorts.select(FactKind.PLAYER_ROUNDS, ReportCohort.TOP, map_name=map_name) if role_of(r.agent) == role)
    if not rounds:
        return None
    zone_deaths = cohorts.select(FactKind.DEATHS, ReportCohort.TOP, map_name=map_name, victim_zone=zone)
    deaths = sum(1 for k in zone_deaths if cohorts.role_of_player(k.match_id, k.victim_puuid) == role)
    return round(deaths / rounds * 100, 1)


def _round_ref(kill: KillFact) -> dict[str, Any]:
    return {"match_id": kill.match_id, "started_at": kill.started_at, "map_name": kill.map_name, "round_number": kill.round_index + 1}


def _clutch(cohorts: ReportCohorts, player: SquadPlayer, label: str, size: Callable[[int], bool]) -> ClutchLine:
    played = [r for r in _own_rounds(cohorts, player) if r.clutch_versus and size(r.clutch_versus)]
    won = ratio(lambda r: r.clutch_won, lambda r: r.clutch_versus > 0 and size(r.clutch_versus))
    return ClutchLine(
        situation=label,
        won=sum(r.clutch_won for r in played),
        played=len(played),
        cell=player_cell(cohorts, FactKind.PLAYER_ROUNDS, won, player),
    )


def _rewatch(cohorts: ReportCohorts, player: SquadPlayer) -> list[RewatchRound]:
    """The player's latest first deaths without revenge in the period."""
    deaths = [k for k in cohorts.squad(FactKind.DEATHS, victim=player.name) if k.opening and not k.avenged]
    deaths.sort(key=lambda k: (k.started_at, k.round_index), reverse=True)
    return [
        RewatchRound(
            **_round_ref(k),
            zone=k.victim_zone,
            weapon=k.weapon,
            side=k.victim_side,
            killer_agent=killer_agent(cohorts, k),
            seconds=round(k.ms / MS_PER_SECOND, 1),
        )
        for k in deaths[:REWATCH_ROUNDS]
    ]
