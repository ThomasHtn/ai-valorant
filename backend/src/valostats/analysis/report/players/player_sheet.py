"""Player sheet: headline band, results by map / agent / side, weapons, death zones, duels, clutches, form, rounds to rewatch.

References follow the player rule of `cells.player_cell`: top ranked and opponents are players of the
same main role, history is the player himself before the period. Agent rows compare with every
player of that agent instead.
"""

import statistics
from collections import Counter, defaultdict
from collections.abc import Callable, Sequence
from datetime import datetime
from typing import Any

from valostats.analysis.report.foundation.art import agent_art, map_art
from valostats.analysis.report.foundation.cells import Metric, cell, fixed, player_cell, ratio
from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohort, ReportCohorts, SquadPlayer
from valostats.analysis.report.foundation.kill_roles import killer_agent
from valostats.analysis.report.foundation.player_metrics import (
    acs,
    adr,
    fbfd_per_round,
    first_deaths_per_round,
    headshot_rate,
    kast,
    kd,
    opening_duels_won,
    revenge_rate,
    rounds_won,
    won_after_first_blood,
    won_after_first_death,
    zero_damage_rate,
)
from valostats.analysis.report.foundation.table_builder import TableBuilder
from valostats.constants.agents import role_of
from valostats.constants.game import UNITS_PER_METRE
from valostats.constants.players import DEATH_ZONES, REWATCH_ROUNDS, TOP_WEAPONS
from valostats.constants.report import MIN_PLAYER_SAMPLE, MIN_TEAM_SAMPLE
from valostats.core.errors import NotFoundError
from valostats.domain.enums import Reference, Side
from valostats.domain.facts import KillFact, MatchFact, PlayerMatchFact, PlayerRoundFact
from valostats.schemas.report.player import (
    AgentPlayed,
    ClutchLine,
    DeathZone,
    FormMatch,
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

# (key, label, format, better, glossary key, metric) of the headline band, in display order.
HEADLINE: tuple[tuple[str, str, ValueFormat, int, str, Metric], ...] = (
    ("acs", "ACS", ValueFormat.INTEGER, 1, "acs", acs),
    ("kd", "K/D", ValueFormat.DECIMAL_2, 1, "kd", kd),
    ("adr", "ADR", ValueFormat.INTEGER, 1, "adr", adr),
    ("kast", "KAST", ValueFormat.PERCENT, 1, "kast", kast),
    ("hs", "HS", ValueFormat.PERCENT, 1, "hs", headshot_rate),
    ("fbfd", "FB-FD par round", ValueFormat.DECIMAL_2, 1, "fbfdPerRound", fbfd_per_round),
    ("revenge", "Morts avec revenge", ValueFormat.PERCENT, 1, "deathsRevenged", revenge_rate),
    ("zeroDmg", "Morts à 0 dégât", ValueFormat.PERCENT, -1, "zeroDamageDeaths", zero_damage_rate),
)

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
        headline=[_headline(cohorts, player, *line) for line in HEADLINE],
        by_map=_split_table(cohorts, player, "maps", "Par carte", "Carte", _map_rows(cohorts, player)),
        by_agent=_split_table(cohorts, player, "agents", "Par agent", "Agent", _agent_rows(played), by_agent=True),
        by_side=_split_table(cohorts, player, "sides", "Par side", "Side", _side_rows()),
        weapons=_weapons(cohorts, player),
        death_zones=_death_zones(cohorts, player),
        opening_duels=OpeningDuels(
            first_bloods=sum(r.first_blood for r in rounds),
            first_deaths=sum(r.first_death for r in rounds),
            duels_won=player_cell(cohorts, FactKind.PLAYER_ROUNDS, opening_duels_won, player),
            won_after_first_blood=player_cell(cohorts, FactKind.PLAYER_ROUNDS, won_after_first_blood, player),
            won_after_first_death=player_cell(cohorts, FactKind.PLAYER_ROUNDS, won_after_first_death, player),
        ),
        clutches=[_clutch(cohorts, player, label, size) for label, size in CLUTCHES],
        form=_form(cohorts, player),
        rewatch=_rewatch(cohorts, player),
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
        main_agent=player.main_agent,
        role=player.role,
        rank=ranked[-1].tier_name if ranked else None,
        matches=len(matches),
        rounds=len(_own_rounds(cohorts, player)),
    )


def _headline(
    cohorts: ReportCohorts, player: SquadPlayer, key: str, label: str, value_format: ValueFormat, better: int, help: str, metric: Metric
) -> HeadlineStat:
    return HeadlineStat(
        key=key,
        label=label,
        format=value_format,
        better=better,
        help=help,
        min=MIN_TEAM_SAMPLE,
        cell=player_cell(cohorts, FactKind.PLAYER_ROUNDS, metric, player),
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
) -> StatTable:
    """Results of the player on each map, agent or side.

    Top and opp references are players of his role on the same map or side; on an agent row, every
    player of that agent. The row fields are equality filters, so every reference is an index lookup.
    """
    table = (
        TableBuilder(f"player-{suffix}", title, rows_label)
        .count_column("matches", "Matchs")
        .column("wl", "V-D", ValueFormat.TEXT, 0, ref=Reference.NONE, min=0)
        .column("rw", "Rounds gagnés", help="roundsWon", min=MIN_PLAYER_SAMPLE, ref=Reference.HISTORY)
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
        cells = {"matches": fixed(len(matches)), "wl": fixed(f"{wins}-{len(matches) - wins}", len(matches))}
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
    out = []
    for weapon, n in counts.most_common(TOP_WEAPONS):
        hits, shots = headshot_rate([r for r in rounds if r.weapon == weapon])
        distances = [k.distance / UNITS_PER_METRE for k in kills if k.weapon == weapon and k.distance is not None]
        out.append(
            WeaponUse(
                weapon=weapon,
                kills=n,
                share=round(n / len(kills), 4),
                headshot_rate=round(hits, 4) if hits is not None else None,
                shots=shots,
                distance=round(statistics.median(distances), 1) if distances else None,
            )
        )
    return out


def _death_zones(cohorts: ReportCohorts, player: SquadPlayer) -> list[DeathZone]:
    deaths: list[KillFact] = list(cohorts.squad(FactKind.DEATHS, victim=player.name))
    by_zone: defaultdict[tuple[str, str], list[KillFact]] = defaultdict(list)
    for death in deaths:
        by_zone[(death.map_name, death.victim_zone)].append(death)
    zones = sorted(by_zone.items(), key=lambda x: (-len(x[1]), x[0]))[:DEATH_ZONES]
    out = []
    for (map_name, zone), group in zones:
        group.sort(key=lambda k: (k.started_at, k.round_index, k.ms))
        first = sum(k.opening for k in group)
        out.append(
            DeathZone(
                map_name=map_name,
                zone=zone,
                deaths=len(group),
                share=round(len(group) / len(deaths), 4),
                first_deaths=first,
                first_death_share=round(first / len(group), 4),
                rounds=[ZoneDeath(**_round_ref(k), side=k.victim_side, first_death=k.opening) for k in group],
            )
        )
    return out


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


def _form(cohorts: ReportCohorts, player: SquadPlayer) -> list[FormMatch]:
    """Every match of the player up to the end of the period, oldest first."""
    dated: list[tuple[datetime, FormMatch]] = []
    for cohort in (ReportCohort.HISTORY, ReportCohort.SQUAD):
        matches: dict[str, MatchFact] = {m.match_id: m for m in cohorts.select(FactKind.MATCHES, cohort)}
        # Kills, deaths and assists of each match, summed from the player's rounds.
        totals: defaultdict[str, list[int]] = defaultdict(lambda: [0, 0, 0])
        for r in cohorts.select(FactKind.PLAYER_ROUNDS, cohort, name=player.name):
            line = totals[r.match_id]
            line[0] += r.kills
            line[1] += r.deaths
            line[2] += r.assists
        for p in cohorts.select(FactKind.PLAYER_MATCHES, cohort, name=player.name):
            match = matches[p.match_id]
            kills, deaths, assists = totals[p.match_id]
            entry = FormMatch(
                match_id=p.match_id,
                day=p.started_at.date(),
                map_name=p.map_name,
                agent=p.agent,
                acs=round(p.score / p.rounds, 1) if p.rounds else 0.0,
                kills=kills,
                deaths=deaths,
                assists=assists,
                won=p.won,
                score=f"{match.rounds_won}-{match.rounds_lost}",
                in_period=cohort is ReportCohort.SQUAD,
            )
            dated.append((match.started_at, entry))
    return [entry for _, entry in sorted(dated, key=lambda x: x[0])]


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
