"""Domain "Ouvertures": first bloods, first deaths and opening duels, by map and side, player and weapon."""

from collections import Counter
from collections.abc import Callable
from typing import Any

from valostats.analysis.report.domains._players import PlayerFacts, player_art
from valostats.analysis.report.foundation.art import map_art, slug, weapon_art
from valostats.analysis.report.foundation.cells import cell, fixed, median, ratio, sum_ratio
from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohort, ReportCohorts
from valostats.analysis.report.foundation.table_builder import TableBuilder
from valostats.constants.report import MIN_TEAM_SAMPLE
from valostats.constants.report_domains import (
    MIN_OPENING_WEAPON_DUELS,
    MIN_PLAYER_DUELS,
    MIN_PLAYER_EVENTS,
    MIN_PLAYER_ROUNDS,
    MIN_SIDE_SAMPLE,
)
from valostats.domain.enums import KillMeans, Reference, Side
from valostats.domain.facts import KillFact, PlayerRoundFact, RoundFact
from valostats.schemas.report.tables import StatCell, StatTable, ValueFormat

SIDE_LABELS = {Side.ATTACK: "attaque", Side.DEFENSE: "défense"}
# Row grouping abilities, ultimates (incl. unnamed Chamber and Neon ones) and melee kills.
ABILITIES_ROW = "Capacités"


def tables(cohorts: ReportCohorts) -> list[StatTable]:
    return [_by_map_side(cohorts), _by_side(cohorts), _by_player(cohorts), _by_weapon(cohorts)]


def _had_opening(r: RoundFact) -> bool:
    return r.first_kill is not None


def _team_table(table_id: str, title: str, rows_label: str, sample: int) -> TableBuilder:
    # `sample` is the minimum of rounds with a kill; conversions rest on about half of them.
    return (
        TableBuilder(table_id, title, rows_label, help="firstBloodRate")
        .column("fb", "First blood pris", help="firstBloodRate", min=sample)
        .column("wfb", "Rounds gagnés après first blood", help="wonAfterFirstBlood", min=sample // 2)
        .column("wfd", "Rounds gagnés après first death", help="wonAfterFirstDeath", min=sample // 2)
        .column("fdr", "First deaths avec revenge", help="firstDeathRevenge", min=sample // 2)
        .column("time", "Temps du premier kill", ValueFormat.SECONDS, 0, help="firstKillTime", min=sample)
        .count_column("duels", "Duels d'ouverture", help="openingDuels")
    )


def _team_cells(cohorts: ReportCohorts, **equal: Any) -> dict[str, StatCell]:
    rounds = cohorts.squad(FactKind.ROUNDS, **equal)
    return {
        "fb": cell(cohorts, FactKind.ROUNDS, ratio(lambda r: r.first_kill is True, _had_opening), **equal),
        "wfb": cell(cohorts, FactKind.ROUNDS, ratio(lambda r: r.won, lambda r: r.first_kill is True), **equal),
        "wfd": cell(cohorts, FactKind.ROUNDS, ratio(lambda r: r.won, lambda r: r.first_kill is False), **equal),
        "fdr": cell(cohorts, FactKind.ROUNDS, ratio(lambda r: r.first_death_avenged is True, lambda r: r.first_kill is False), **equal),
        "time": cell(cohorts, FactKind.ROUNDS, median(lambda r: r.first_kill_ms / 1000 if r.first_kill_ms is not None else None), **equal),
        "duels": fixed(sum(1 for r in rounds if _had_opening(r)), len(rounds)),
    }


def _by_map_side(cohorts: ReportCohorts) -> StatTable:
    table = _team_table("opening-map-side", "Ouvertures par carte et par côté", "Carte", MIN_SIDE_SAMPLE)
    for map_name in cohorts.maps():
        for side, label in SIDE_LABELS.items():
            table.row(
                f"{slug(map_name)}-{side}",
                f"{map_name} · {label}",
                _team_cells(cohorts, map_name=map_name, side=side),
                art=map_art(map_name),
                sub=label,
            )
    return table.build()


def _by_side(cohorts: ReportCohorts) -> StatTable:
    table = _team_table("opening-side", "Ouvertures par côté, toutes cartes", "Côté", MIN_TEAM_SAMPLE)
    for side, label in SIDE_LABELS.items():
        table.row(side.value, label.capitalize(), _team_cells(cohorts, side=side))
    return table.build()


def _by_player(cohorts: ReportCohorts) -> StatTable:
    table = (
        TableBuilder(
            "opening-players",
            "Ouvertures par joueur",
            "Joueur",
            help="openingDuelsWon",
            note="Référence top ranked : joueurs du même rôle.",
        )
        .count_column("fb", "First bloods", help="playerFirstBloods")
        .count_column("fd", "First deaths", help="playerFirstDeaths")
        .column("net", "FB - FD", ValueFormat.TEXT, 0, help="firstBloodNet", ref=Reference.NONE, min=0)
        .column("duel", "Duels d'ouverture gagnés", help="openingDuelsWon", min=MIN_PLAYER_DUELS)
        .column("wfb", "Rounds gagnés après sa first blood", help="wonAfterOwnFirstBlood", min=MIN_PLAYER_EVENTS)
        .column("wfd", "Rounds gagnés après sa first death", help="wonAfterOwnFirstDeath", min=MIN_PLAYER_EVENTS)
        .column("fdr", "First deaths avec revenge", help="firstDeathRevenge", min=MIN_PLAYER_EVENTS)
        .column("fbr", "First bloods par round", ValueFormat.DECIMAL_2, help="firstBloodsPerRound", min=MIN_PLAYER_ROUNDS)
    )

    def in_duel(p: PlayerRoundFact) -> bool:
        return p.first_blood or p.first_death

    facts = PlayerFacts(cohorts)
    rounds = FactKind.PLAYER_ROUNDS
    for player in cohorts.players():
        own: list[PlayerRoundFact] = facts.of_player(rounds, ReportCohort.SQUAD, player.name)
        first_bloods, first_deaths = sum(p.first_blood for p in own), sum(p.first_death for p in own)
        table.row(
            player.name,
            player.name,
            {
                "fb": fixed(first_bloods, len(own)),
                "fd": fixed(first_deaths, len(own)),
                "net": fixed(f"{first_bloods - first_deaths:+d}", first_bloods + first_deaths),
                "duel": facts.cell(rounds, ratio(lambda p: p.first_blood, in_duel), player),
                "wfb": facts.cell(rounds, ratio(lambda p: p.won, lambda p: p.first_blood), player),
                "wfd": facts.cell(rounds, ratio(lambda p: p.won, lambda p: p.first_death), player),
                "fdr": facts.cell(rounds, ratio(lambda p: p.traded, lambda p: p.first_death), player),
                "fbr": facts.cell(rounds, sum_ratio(lambda p: int(p.first_blood)), player),
            },
            art=player_art(player),
        )
    return table.build()


def weapon_group(kill: KillFact) -> str:
    """Weapon row of a kill: the gun's name, or the abilities row for anything else."""
    return kill.weapon if kill.means is KillMeans.WEAPON and kill.weapon else ABILITIES_ROW


def _by_weapon(cohorts: ReportCohorts) -> StatTable:
    table = (
        TableBuilder("opening-weapons", "Armes des duels d'ouverture", "Arme", help="openingWeapons")
        .column("fbShare", "Part des first bloods", better=0, help="openingWeaponFb")
        .column("fdShare", "Part des first deaths", better=0, help="openingWeaponFd")
        .column("duel", "Duels d'ouverture gagnés", help="openingWeaponDuel", min=MIN_PLAYER_EVENTS)
        .count_column("events", "Duels")
    )
    openings = [*cohorts.squad(FactKind.KILLS, opening=True), *cohorts.squad(FactKind.DEATHS, opening=True)]
    duels = Counter(weapon_group(k) for k in openings)
    weapons = sorted((w for w, n in duels.items() if n >= MIN_OPENING_WEAPON_DUELS and w != ABILITIES_ROW), key=str.lower)
    if duels[ABILITIES_ROW] >= MIN_OPENING_WEAPON_DUELS:
        weapons.append(ABILITIES_ROW)

    for weapon in weapons:
        is_weapon = _weapon_is(weapon)
        cells = {
            "fbShare": cell(cohorts, FactKind.KILLS, ratio(is_weapon), opening=True),
            "fdShare": cell(cohorts, FactKind.DEATHS, ratio(is_weapon), opening=True),
            "events": fixed(duels[weapon], duels[weapon]),
        }
        if weapon != ABILITIES_ROW:
            # Duels won with the gun bought at the start of the round: it may not be the one in hand.
            cells["duel"] = cell(
                cohorts,
                FactKind.PLAYER_ROUNDS,
                ratio(lambda p: p.first_blood, _opening_duel_with(weapon)),
            )
        table.row(slug(weapon), weapon, cells, art=weapon_art(weapon) if weapon != ABILITIES_ROW else None)
    return table.build()


def _weapon_is(weapon: str) -> Callable[[KillFact], bool]:
    return lambda k: weapon_group(k) == weapon


def _opening_duel_with(weapon: str) -> Callable[[PlayerRoundFact], bool]:
    """Player-rounds with an opening duel (first blood or first death) and this gun bought."""
    return lambda p: (p.first_blood or p.first_death) and p.weapon == weapon
