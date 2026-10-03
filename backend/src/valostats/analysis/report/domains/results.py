"""Domain "Résultats": results by map, by round type, by the course of the match, and round endings."""

from collections.abc import Callable
from typing import Any

from valostats.analysis.report.foundation.art import map_art
from valostats.analysis.report.foundation.cells import cell, fixed, mean, ratio
from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohorts
from valostats.analysis.report.foundation.table_builder import TableBuilder
from valostats.constants.report import CHEAPER_LOADOUT_GAP, MIN_MATCH_SAMPLE, MIN_PISTOL_SAMPLE
from valostats.domain.enums import BuyType, Reference, Side
from valostats.domain.facts import MatchFact, RoundFact
from valostats.schemas.report.tables import StatCell, StatTable, ValueFormat

RoundFilter = Callable[[RoundFact], bool]

# Rounds 2 and 3 of each half (0-based), where the pistol result drives the economy.
SECOND_ROUNDS = (1, 13)
THIRD_ROUNDS = (2, 14)


def tables(cohorts: ReportCohorts) -> list[StatTable]:
    return [_by_map(cohorts), _by_round_type(cohorts), _by_context(cohorts), _round_endings(cohorts)]


def _won(r: RoundFact) -> bool:
    return r.won


def _side(side: Side) -> RoundFilter:
    return lambda r: r.side is side


def _by_map(cohorts: ReportCohorts) -> StatTable:
    # Rounds and pistols won are symmetric: top ranked is always 50 % and opponents the mirror, so the
    # squad is compared with its own history.
    table = (
        TableBuilder("results-maps", "Résultats par carte", "Carte", help="roundsWon")
        .count_column("matches", "Matchs")
        .column("wl", "V-D", ValueFormat.TEXT, 0, min=0, ref=Reference.NONE)
        .column("rw", "Rounds gagnés", help="roundsWon", ref=Reference.HISTORY)
        .column("diff", "Écart moyen au score", ValueFormat.DECIMAL_1, help="roundDiff", min=MIN_MATCH_SAMPLE, ref=Reference.HISTORY)
        .column("att", "Attaque", help="sideRounds")
        .column("def", "Défense", help="sideRounds")
        .column("pistol", "Pistols", help="pistols", min=MIN_PISTOL_SAMPLE, ref=Reference.HISTORY)
        .column("flawless", "Rounds parfaits", help="flawless")
        .count_column("ot", "Prolongations")
    )

    def cells(**equal: Any) -> dict[str, StatCell]:
        matches: list[MatchFact] = list(cohorts.squad(FactKind.MATCHES, **equal))
        wins = sum(m.won for m in matches)
        return {
            "matches": fixed(len(matches)),
            "wl": fixed(f"{wins}-{len(matches) - wins}"),
            "rw": cell(cohorts, FactKind.ROUNDS, ratio(_won), **equal),
            "diff": cell(cohorts, FactKind.MATCHES, mean(lambda m: m.rounds_won - m.rounds_lost), **equal),
            "att": cell(cohorts, FactKind.ROUNDS, ratio(_won, _side(Side.ATTACK)), **equal),
            "def": cell(cohorts, FactKind.ROUNDS, ratio(_won, _side(Side.DEFENSE)), **equal),
            "pistol": cell(cohorts, FactKind.ROUNDS, ratio(_won, lambda r: r.buy is BuyType.PISTOL), **equal),
            "flawless": cell(cohorts, FactKind.ROUNDS, ratio(lambda r: r.flawless), **equal),
            # Overtime starts after 24 rounds.
            "ot": fixed(sum(1 for m in matches if m.rounds > 24)),
        }

    for map_name in cohorts.maps():
        table.row(map_name, map_name, cells(map_name=map_name), art=map_art(map_name))
    table.row("all", "Toutes les cartes", cells(), total=True)
    return table.build()


def _by_round_type(cohorts: ReportCohorts) -> StatTable:
    table = (
        TableBuilder("results-round-types", "Rounds gagnés par type de round", "Type de round", help="roundTypes")
        .column("rw", "Rounds gagnés", help="roundsWon")
        .column("att", "Attaque")
        .column("def", "Défense")
    )
    round_types: list[tuple[str, str, RoundFilter]] = [
        ("pistol", "Pistol", lambda r: r.buy is BuyType.PISTOL),
        ("r2w", "R2 après pistol gagné", lambda r: r.round_index in SECOND_ROUNDS and r.pistol_won is True),
        ("r2l", "R2 après pistol perdu", lambda r: r.round_index in SECOND_ROUNDS and r.pistol_won is False),
        (
            "r3b",
            "R3 bonus (pistol et R2 gagnés)",
            lambda r: r.round_index in THIRD_ROUNDS and r.pistol_won is True and r.second_round_won is True,
        ),
        ("r3l", "R3 après pistol perdu", lambda r: r.round_index in THIRD_ROUNDS and r.pistol_won is False),
        ("eco", "Eco", lambda r: r.buy is BuyType.ECO),
        ("force", "Force buy", lambda r: r.buy is BuyType.FORCE),
        ("full", "Full buy", lambda r: r.buy is BuyType.FULL),
        ("fullvsfull", "Full buy contre full buy", lambda r: r.buy is BuyType.FULL and r.opp_buy is BuyType.FULL),
        (
            "cheaper",
            "Moins équipé que l'adversaire",
            lambda r: r.buy is not BuyType.PISTOL and r.loadout < r.opp_loadout - CHEAPER_LOADOUT_GAP,
        ),
    ]
    for key, label, among in round_types:
        table.row(
            key,
            label,
            {
                "rw": cell(cohorts, FactKind.ROUNDS, ratio(_won, among)),
                "att": cell(cohorts, FactKind.ROUNDS, ratio(_won, among), side=Side.ATTACK),
                "def": cell(cohorts, FactKind.ROUNDS, ratio(_won, among), side=Side.DEFENSE),
            },
        )
    return table.build()


def _by_context(cohorts: ReportCohorts) -> StatTable:
    table = TableBuilder("results-context", "Rounds gagnés selon le déroulé du match", "Situation", help="roundContext").column(
        "rw", "Rounds gagnés", help="roundsWon", ref=Reference.HISTORY
    )
    contexts: list[tuple[str, str, RoundFilter]] = [
        ("afterwin", "Après un round gagné", lambda r: r.previous_won is True),
        ("after1", "Après 1 round perdu", lambda r: r.previous_losses == 1),
        ("after2", "Après 2 rounds perdus ou plus", lambda r: r.previous_losses >= 2),
        ("behind3", "Mené de 3 rounds ou plus", lambda r: r.score_diff <= -3),
        ("behind1", "Mené de 1 ou 2 rounds", lambda r: -2 <= r.score_diff <= -1),
        ("tied", "Score égal", lambda r: r.score_diff == 0),
        ("ahead1", "Devant de 1 ou 2 rounds", lambda r: 1 <= r.score_diff <= 2),
        ("ahead3", "Devant de 3 rounds ou plus", lambda r: r.score_diff >= 3),
        ("half1", "Première mi-temps", lambda r: r.round_index < 12),
        ("half2", "Seconde mi-temps", lambda r: 12 <= r.round_index < 24),
        ("ot", "Prolongations", lambda r: r.round_index >= 24),
    ]
    for key, label, among in contexts:
        table.row(key, label, {"rw": cell(cohorts, FactKind.ROUNDS, ratio(_won, among))})
    return table.build()


def _round_endings(cohorts: ReportCohorts) -> StatTable:
    # Shares of won and lost rounds: a profile of how rounds end, never coloured.
    table = (
        TableBuilder("results-endings", "Comment les rounds se terminent", "Fin de round", help="roundEnd")
        .column("won", "Rounds gagnés ainsi", better=0)
        .column("lost", "Rounds perdus ainsi", better=0)
    )
    endings: list[tuple[str, str, RoundFilter]] = [
        ("elim", "Élimination", lambda r: r.result == "Elimination" and not r.timeout),
        ("detonate", "Explosion du spike", lambda r: r.result == "Detonate"),
        ("defuse", "Defuse", lambda r: r.result == "Defuse"),
        (
            "time",
            "Temps écoulé sans plant",
            lambda r: r.timeout or (r.side is Side.DEFENSE and r.won and not r.planted and r.opp_alive_end > 0),
        ),
    ]
    for key, label, ending in endings:
        table.row(
            key,
            label,
            {
                "won": cell(cohorts, FactKind.ROUNDS, ratio(ending, _won)),
                "lost": cell(cohorts, FactKind.ROUNDS, ratio(ending, lambda r: not r.won)),
            },
        )
    return table.build()
