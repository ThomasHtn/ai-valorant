"""Domain "Situations": rounds won from each XvY state, numbers advantage, clutches, win matrix by players alive."""

from collections import defaultdict
from collections.abc import Callable, Sequence
from typing import Any

from valostats.analysis.report.domains._players import PlayerFacts, player_art
from valostats.analysis.report.foundation.cells import cell, fixed, ratio, sum_ratio, versus_history
from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohort, ReportCohorts
from valostats.analysis.report.foundation.table_builder import TableBuilder
from valostats.constants.game import TEAM_SIZE
from valostats.constants.report_domains import (
    MIN_CLUTCH_SAMPLE,
    MIN_PLAYER_ROUNDS,
    MIN_SITUATION_SAMPLE,
    MIN_SITUATION_SIDE_SAMPLE,
    NUMBERS_SWING,
)
from valostats.domain.enums import Reference, Side
from valostats.domain.facts import KillFact, PlayerRoundFact, RoundFact
from valostats.schemas.report.tables import StatCell, StatTable, ValueFormat

# States listed in the XvY table, own players first.
STATES = ("5v4", "4v5", "5v3", "3v5", "4v4", "4v3", "3v4", "4v2", "2v4", "3v3", "3v2", "2v3", "2v2", "2v1", "1v2", "1v1")
SIDE_LABELS = {Side.ATTACK: "Attaque", Side.DEFENSE: "Défense"}
# Round key (match, round, team) -> (ms with more players, ms with fewer players, ms observed).
RoundTimes = dict[tuple[str, int, str], tuple[int, int, int]]


def tables(cohorts: ReportCohorts) -> list[StatTable]:
    return [_xvy(cohorts), _advantage(cohorts), _clutch_sizes(cohorts), _clutch_players(cohorts), _matrix(cohorts)]


def _won(r: RoundFact) -> bool:
    return r.won


def _reached(state: str) -> Callable[[RoundFact], bool]:
    return lambda r: state in r.states


def _xvy(cohorts: ReportCohorts) -> StatTable:
    table = (
        TableBuilder("situations-xvy", "Rounds gagnés par situation", "Situation", help="xvyWon")
        .column("reach", "Rounds où la situation arrive", better=0, help="xvyReach")
        .column("won", "Rounds gagnés", help="xvyWon", min=MIN_SITUATION_SAMPLE)
        .column("att", "Attaque", help="xvyWon", min=MIN_SITUATION_SIDE_SAMPLE)
        .column("def", "Défense", help="xvyWon", min=MIN_SITUATION_SIDE_SAMPLE)
    )
    for state in STATES:
        reached = _reached(state)
        table.row(
            state,
            state,
            {
                "reach": cell(cohorts, FactKind.ROUNDS, ratio(reached)),
                "won": _state_won(cohorts, state),
                "att": cell(cohorts, FactKind.ROUNDS, ratio(_won, reached), side=Side.ATTACK),
                "def": cell(cohorts, FactKind.ROUNDS, ratio(_won, reached), side=Side.DEFENSE),
            },
        )
    return table.build()


def numbers_times(rounds: Sequence[RoundFact], kills: Sequence[KillFact]) -> RoundTimes:
    """Time each team spent with more and with fewer players alive, from the start to the last event.

    Each span up to a kill takes the counts right before it (a revive, a disconnect or a fall since the
    previous kill shows there); the victim's team then loses one.
    """
    by_round: defaultdict[tuple[str, int], list[KillFact]] = defaultdict(list)
    for k in kills:
        by_round[(k.match_id, k.round_index)].append(k)
    times: RoundTimes = {}
    for r in rounds:
        ahead = behind = 0
        previous_ms, difference = 0, 0
        for k in sorted(by_round[(r.match_id, r.round_index)], key=lambda k: k.ms):
            if k.ms > r.last_event_ms:
                break
            own_side = k.victim_team == r.team_id
            before = k.victim_team_alive - k.killer_team_alive
            difference = before if own_side else -before
            span = k.ms - previous_ms
            ahead += span if difference > 0 else 0
            behind += span if difference < 0 else 0
            previous_ms, difference = k.ms, difference - 1 if own_side else difference + 1
        span = max(0, r.last_event_ms - previous_ms)
        ahead += span if difference > 0 else 0
        behind += span if difference < 0 else 0
        times[(r.match_id, r.round_index, r.team_id)] = (ahead, behind, r.last_event_ms)
    return times


def _advantage(cohorts: ReportCohorts) -> StatTable:
    table = (
        TableBuilder("situations-advantage", "Avantage numérique", "Côté", help="throws")
        .column("up2", "Rounds avec +2 joueurs", help="reachPlus2")
        .column("throw", "Throws", better=-1, help="throws", min=MIN_SITUATION_SAMPLE)
        .column("down2", "Rounds avec -2 joueurs", better=-1, help="reachMinus2")
        .column("comeback", "Comebacks", help="comebacks", min=MIN_SITUATION_SAMPLE)
        .column("advTime", "Temps en avantage", help="advantageTime", proportion=False)
        .column("disTime", "Temps en infériorité", better=-1, help="advantageTime", proportion=False)
    )
    times: RoundTimes = {}
    for cohort in ReportCohort:
        index = cohorts.indexes[cohort]
        # Every kill of a round: the cohort's deaths and the cohort's kills (top holds both teams in each).
        kills = list({id(k): k for k in (*index.all(FactKind.DEATHS), *index.all(FactKind.KILLS))}.values())
        times.update(numbers_times(index.all(FactKind.ROUNDS), kills))

    def time_of(r: RoundFact) -> tuple[int, int, int]:
        return times.get((r.match_id, r.round_index, r.team_id), (0, 0, 0))

    def cells(**equal: Any) -> dict[str, StatCell]:
        def rounds(metric: Callable[[Sequence[RoundFact]], tuple[float | None, int]]) -> StatCell:
            return cell(cohorts, FactKind.ROUNDS, metric, **equal)

        return {
            "up2": rounds(ratio(lambda r: r.max_advantage >= NUMBERS_SWING)),
            "throw": rounds(ratio(lambda r: not r.won, lambda r: r.max_advantage >= NUMBERS_SWING)),
            "down2": rounds(ratio(lambda r: r.min_advantage <= -NUMBERS_SWING)),
            "comeback": rounds(ratio(_won, lambda r: r.min_advantage <= -NUMBERS_SWING)),
            "advTime": rounds(sum_ratio(lambda r: time_of(r)[0], lambda r: time_of(r)[2])),
            "disTime": rounds(sum_ratio(lambda r: time_of(r)[1], lambda r: time_of(r)[2])),
        }

    for side, label in SIDE_LABELS.items():
        table.row(side.value, label, cells(side=side))
    table.row("all", "Les deux côtés", cells(), total=True)
    return table.build()


def _clutch_sizes(cohorts: ReportCohorts) -> StatTable:
    table = (
        TableBuilder("situations-clutch-sizes", "Clutchs par taille", "Clutch", help="clutch")
        .count_column("tries", "Tentés", help="clutch")
        .column("wn", "Gagnés / tentés", ValueFormat.TEXT, 0, help="clutch", min=0, ref=Reference.NONE)
        .column("won", "Clutchs gagnés", help="clutch", min=MIN_CLUTCH_SAMPLE)
    )
    sizes: list[tuple[str, str, Callable[[PlayerRoundFact], bool]]] = [(f"1v{n}", f"1v{n}", _versus(n)) for n in range(1, TEAM_SIZE + 1)]
    sizes.append(("all", "Tous les clutchs", lambda p: p.clutch_versus > 0))
    squad_rounds: Sequence[PlayerRoundFact] = cohorts.squad(FactKind.PLAYER_ROUNDS)
    for key, label, size in sizes:
        tries = [p for p in squad_rounds if size(p)]
        won = sum(p.clutch_won for p in tries)
        table.row(
            key,
            label,
            {
                "tries": fixed(len(tries), len(tries)),
                "wn": fixed(f"{won}/{len(tries)}", len(tries)),
                "won": cell(cohorts, FactKind.PLAYER_ROUNDS, ratio(lambda p: p.clutch_won, size)),
            },
            total=key == "all",
        )
    return table.build()


def _clutch_players(cohorts: ReportCohorts) -> StatTable:
    table = (
        TableBuilder(
            "situations-clutch-players", "Clutchs par joueur", "Joueur", help="clutch", note="Référence top ranked : joueurs du même rôle."
        )
        .count_column("tries", "Tentés", help="clutch")
        .column("won", "Clutchs gagnés", help="clutch", min=MIN_CLUTCH_SAMPLE)
        .column("c1", "1v1", ValueFormat.TEXT, 0, help="clutch", min=0, ref=Reference.NONE)
        .column("c2", "1v2", ValueFormat.TEXT, 0, help="clutch", min=0, ref=Reference.NONE)
        .column("c3", "1v3 et plus", ValueFormat.TEXT, 0, help="clutch", min=0, ref=Reference.NONE)
        .column("rate", "Rounds finis en clutch", better=0, help="clutchRate", min=MIN_PLAYER_ROUNDS)
    )
    groups: tuple[tuple[str, Callable[[int], bool]], ...] = (("c1", lambda v: v == 1), ("c2", lambda v: v == 2), ("c3", lambda v: v >= 3))
    facts = PlayerFacts(cohorts)
    for player in cohorts.players():
        tries = [p for p in facts.of_player(FactKind.PLAYER_ROUNDS, ReportCohort.SQUAD, player.name) if p.clutch_versus > 0]
        cells = {
            "tries": fixed(len(tries), len(tries)),
            "won": facts.cell(FactKind.PLAYER_ROUNDS, ratio(lambda p: p.clutch_won, lambda p: p.clutch_versus > 0), player),
            "rate": facts.cell(FactKind.PLAYER_ROUNDS, ratio(lambda p: p.clutch_versus > 0), player),
        }
        for key, size in groups:
            group = [p for p in tries if size(p.clutch_versus)]
            cells[key] = fixed(f"{sum(p.clutch_won for p in group)}/{len(group)}", len(group))
        table.row(player.name, player.name, cells, art=player_art(player))
    return table.build()


def _matrix(cohorts: ReportCohorts) -> StatTable:
    table = TableBuilder(
        "situations-matrix",
        "Rounds gagnés selon les joueurs vivants",
        "Vivants escouade",
        help="aliveMatrix",
        note="Lignes : joueurs vivants de l'escouade. Colonnes : adversaires vivants.",
    )
    alive = range(TEAM_SIZE, 0, -1)
    for opp in alive:
        table.column(f"o{opp}", f"Contre {opp}", help="aliveMatrix", min=MIN_CLUTCH_SAMPLE)
    for own in alive:
        cells = {f"o{opp}": _state_won(cohorts, f"{own}v{opp}") for opp in alive}
        table.row(f"a{own}", f"{own} vivant{'s' if own > 1 else ''}", cells)
    return table.build()


def _state_won(cohorts: ReportCohorts, state: str) -> StatCell:
    won = cell(cohorts, FactKind.ROUNDS, ratio(_won, _reached(state)))
    # Even numbers (3v3): both teams reach it, so top ranked is always at 50 %.
    own, opp = state.split("v")
    return versus_history(won) if own == opp else won


def _versus(opponents: int) -> Callable[[PlayerRoundFact], bool]:
    return lambda p: p.clutch_versus == opponents
