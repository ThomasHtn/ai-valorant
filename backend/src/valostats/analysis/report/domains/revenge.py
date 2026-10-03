"""Domain "Revenge et espacement": revenges, isolated deaths, deaths in a row, spacing, who avenges whom, duos.

"Morts prises de dos" is left out: the victim's view angle is only known from an earlier snapshot
(about 4 s before on average), so the figure mostly measured the age of that snapshot.
"""

import itertools
from collections import Counter, defaultdict
from collections.abc import Callable, Sequence
from typing import Any

from valostats.analysis.report.domains._players import PlayerFacts, player_art
from valostats.analysis.report.foundation.art import map_art, slug
from valostats.analysis.report.foundation.cells import cell, fixed, mean, median, ratio, rounded, sum_ratio
from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohort, ReportCohorts, SquadPlayer
from valostats.analysis.report.foundation.death_rules import has_living_teammate, is_isolated
from valostats.analysis.report.foundation.table_builder import TableBuilder
from valostats.constants.game import UNITS_PER_METRE
from valostats.constants.report_domains import (
    DOUBLE_PEEK_MS,
    MIN_PLAYER_DEATHS,
    MIN_PLAYER_ROUNDS,
    MIN_SIDE_EVENTS,
    MIN_SIDE_SAMPLE,
)
from valostats.domain.enums import Reference, Side
from valostats.domain.facts import KillFact, PlayerRoundFact
from valostats.schemas.report.tables import StatCell, StatTable, ValueFormat

SIDE_LABELS = {Side.ATTACK: "attaque", Side.DEFENSE: "défense"}


def tables(cohorts: ReportCohorts) -> list[StatTable]:
    return [_by_player(cohorts), _by_map_side(cohorts), _who_avenges_whom(cohorts), _duos(cohorts)]


def _avenged(k: KillFact) -> bool:
    return k.avenged


def _by_player(cohorts: ReportCohorts) -> StatTable:
    table = (
        TableBuilder(
            "revenge-players",
            "Revenge et espacement par joueur",
            "Joueur",
            help="deathRevenge",
            note="Référence top ranked : joueurs du même rôle.",
        )
        .column("rev", "Morts avec revenge", help="deathRevenge", min=MIN_PLAYER_DEATHS)
        .column("given", "Revenges données / round", ValueFormat.DECIMAL_2, help="revengesGiven", min=MIN_PLAYER_ROUNDS)
        .column("delay", "Temps avant la revenge", ValueFormat.SECONDS, -1, help="revengeDelay", min=MIN_SIDE_SAMPLE)
        .column("iso", "Morts isolées", better=-1, help="isolatedDeaths", min=MIN_PLAYER_DEATHS)
        .column("near", "Coéquipier le plus proche", ValueFormat.METRES, -1, help="nearestMate", min=MIN_PLAYER_DEATHS)
    )
    facts = PlayerFacts(cohorts)
    deaths = FactKind.DEATHS
    for player in cohorts.players():
        table.row(
            player.name,
            player.name,
            {
                "rev": facts.cell(deaths, ratio(_avenged), player),
                "given": facts.cell(FactKind.PLAYER_ROUNDS, sum_ratio(lambda p: p.revenge_given), player),
                "delay": facts.cell(deaths, median(lambda k: k.avenge_ms / 1000 if k.avenge_ms is not None else None), player),
                "iso": facts.cell(deaths, ratio(is_isolated, has_living_teammate), player),
                "near": facts.cell(deaths, median(_nearest_metres), player),
            },
            art=player_art(player),
        )
    return table.build()


def _nearest_metres(k: KillFact) -> float | None:
    return k.nearest_teammate / UNITS_PER_METRE if k.nearest_teammate is not None else None


def double_peeks(deaths: Sequence[KillFact]) -> set[int]:
    """Ids of the deaths followed or preceded, within 5 s and in the same zone, by a teammate's death, neither avenged."""
    by_round: defaultdict[tuple[str, int, str], list[KillFact]] = defaultdict(list)
    for k in deaths:
        if not k.avenged:
            by_round[(k.match_id, k.round_index, k.victim_team)].append(k)
    flagged: set[int] = set()
    for group in by_round.values():
        for a, b in itertools.combinations(group, 2):
            if a.victim_zone == b.victim_zone and abs(a.ms - b.ms) <= DOUBLE_PEEK_MS:
                flagged.update((id(a), id(b)))
    return flagged


def _by_map_side(cohorts: ReportCohorts) -> StatTable:
    table = (
        TableBuilder("revenge-map-side", "Revenge et espacement par carte et par côté", "Carte", help="deathRevenge")
        .column("rev", "Morts avec revenge", help="deathRevenge", min=MIN_SIDE_EVENTS)
        .column("iso", "Morts isolées", better=-1, help="isolatedDeaths", min=MIN_SIDE_EVENTS)
        .column("double", "Morts groupées sans revenge", better=-1, help="doublePeek", min=MIN_SIDE_EVENTS)
        .column("spread", "Écartement de l'équipe", ValueFormat.METRES, 0, help="teamSpread", min=MIN_PLAYER_DEATHS, ref=Reference.HISTORY)
    )
    flagged: set[int] = set()
    for cohort in ReportCohort:
        flagged |= double_peeks(cohorts.indexes[cohort].all(FactKind.DEATHS))

    def cells(**equal: Any) -> dict[str, StatCell]:
        def deaths(metric: Callable[[Sequence[KillFact]], tuple[float | None, int]]) -> StatCell:
            return cell(cohorts, FactKind.DEATHS, metric, **equal)

        return {
            "rev": deaths(ratio(_avenged)),
            "iso": deaths(ratio(is_isolated, has_living_teammate)),
            "double": deaths(ratio(lambda k: id(k) in flagged)),
            "spread": deaths(mean(lambda k: k.team_spread / UNITS_PER_METRE if k.team_spread is not None else None)),
        }

    for map_name in cohorts.maps():
        for side, label in SIDE_LABELS.items():
            table.row(
                f"{slug(map_name)}-{side}",
                f"{map_name} · {label}",
                cells(map_name=map_name, victim_side=side),
                art=map_art(map_name),
                sub=label,
            )
    for side, label in SIDE_LABELS.items():
        table.row(f"all-{side}", f"Toutes les cartes · {label}", cells(victim_side=side), sub=label, total=True)
    return table.build()


def _who_avenges_whom(cohorts: ReportCohorts) -> StatTable:
    players = cohorts.players()
    table = TableBuilder(
        "revenge-matrix",
        "Qui venge qui",
        "Joueur mort",
        help="revengeMatrix",
        note="Lignes : joueur mort. Colonnes : coéquipier qui fait la revenge.",
    )
    for avenger in players:
        table.count_column(slug(avenger.name), avenger.name, help="revengeMatrix")
    table.count_column("total", "Total", help="revengeMatrix")
    deaths: Sequence[KillFact] = cohorts.squad(FactKind.DEATHS)
    for dead in players:
        own = [k for k in deaths if k.victim == dead.name]
        by_avenger = Counter(k.avenger for k in own if k.avenged)
        cells = {slug(a.name): fixed(by_avenger[a.name], len(own)) if a.name != dead.name else fixed(None, 0) for a in players}
        cells["total"] = fixed(sum(by_avenger.values()), len(own))
        table.row(dead.name, dead.name, cells, art=player_art(dead))
    return table.build()


class _Lineups:
    """Who played each round of a cohort, whether it was won, and the revenges between squad players."""

    def __init__(self, cohorts: ReportCohorts, cohort: ReportCohort) -> None:
        self.present: defaultdict[tuple[str, int], set[str]] = defaultdict(set)
        self.won: dict[tuple[str, int], bool] = {}
        player_rounds: Sequence[PlayerRoundFact] = cohorts.select(FactKind.PLAYER_ROUNDS, cohort)
        for p in player_rounds:
            self.present[(p.match_id, p.round_index)].add(p.name)
            self.won[(p.match_id, p.round_index)] = p.won
        deaths: Sequence[KillFact] = cohorts.select(FactKind.DEATHS, cohort)
        self.revenges = Counter(frozenset((k.victim, k.avenger)) for k in deaths if k.avenged and k.avenger)

    def duo(self, a: SquadPlayer, b: SquadPlayer) -> tuple[int, int, int]:
        """Rounds the two played together, rounds won together, revenges between them."""
        together = [key for key, names in self.present.items() if a.name in names and b.name in names]
        return len(together), sum(self.won[key] for key in together), self.revenges[frozenset((a.name, b.name))]


def _duos(cohorts: ReportCohorts) -> StatTable:
    # Six players share five spots: duo results mostly show who sat out, so they are compared with history only.
    table = (
        TableBuilder("revenge-duos", "Duos", "Duo", help="duoRevenges")
        .count_column("rounds", "Rounds ensemble", help="duoRounds")
        .column("won", "Rounds gagnés ensemble", help="duoRoundsWon", min=MIN_PLAYER_ROUNDS, ref=Reference.HISTORY)
        .count_column("revs", "Revenges entre eux", help="duoRevenges")
        .column(
            "revRate",
            "Revenges entre eux / 100 rounds",
            ValueFormat.DECIMAL_1,
            help="duoRevenges",
            min=MIN_PLAYER_ROUNDS,
            ref=Reference.HISTORY,
        )
    )
    period, history = _Lineups(cohorts, ReportCohort.SQUAD), _Lineups(cohorts, ReportCohort.HISTORY)
    for a, b in itertools.combinations(cohorts.players(), 2):
        rounds, won, revenges = period.duo(a, b)
        past_rounds, past_won, past_revenges = history.duo(a, b)
        table.row(
            f"{slug(a.name)}-{slug(b.name)}",
            f"{a.name} + {b.name}",
            {
                "rounds": fixed(rounds, rounds),
                "won": _history_cell(won, rounds, past_won, past_rounds),
                "revs": fixed(revenges, rounds),
                "revRate": _history_cell(100 * revenges, rounds, 100 * past_revenges, past_rounds),
            },
        )
    return table.build()


def _history_cell(total: float, sample: int, past_total: float, past_sample: int) -> StatCell:
    """A rate per round of the period next to the same rate before the period."""
    return StatCell(
        v=rounded(total / sample) if sample else None,
        n=sample,
        hist=rounded(past_total / past_sample) if past_sample else None,
        hist_n=past_sample,
    )
