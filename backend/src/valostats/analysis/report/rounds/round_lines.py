"""Rounds list of the Rounds view: one line per squad round of the period, with its cause and best moment."""

from collections import defaultdict
from collections.abc import Iterable, Mapping, Sequence
from datetime import date

from valostats.analysis.extraction.win_probability import WinProbabilityTable
from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohort, ReportCohorts
from valostats.analysis.report.overview.evenings import evenings
from valostats.analysis.report.rounds.loss_causes import loss_cause
from valostats.analysis.report.rounds.round_states import RoundKey, best_moment, kills_by_round, team_states
from valostats.constants.rounds import PROBABILITY_DECIMALS
from valostats.domain.facts import KillFact, MatchFact, RoundFact
from valostats.schemas.report.rounds import RoundIndex, RoundLine


def evening_days(matches: Iterable[MatchFact]) -> dict[str, date]:
    """Day of the evening each squad match belongs to (a match after midnight keeps the evening's day)."""
    return {m.match_id: evening.day for evening in evenings(matches) for m in evening.matches}


def round_lines(
    rounds: Iterable[RoundFact],
    kills: Mapping[RoundKey, Sequence[KillFact]],
    table: WinProbabilityTable,
    days: Mapping[str, date],
) -> list[RoundLine]:
    """Lines of the given squad rounds, newest match first and last round first.

    Rounds of a match must all be given: the score before each round counts the earlier ones.
    """
    by_match: defaultdict[str, list[RoundFact]] = defaultdict(list)
    for fact in rounds:
        by_match[fact.match_id].append(fact)
    lines: list[RoundLine] = []
    for match_rounds in by_match.values():
        won = lost = 0
        for fact in sorted(match_rounds, key=lambda r: r.round_index):
            lines.append(_line(fact, f"{won}-{lost}", kills.get((fact.match_id, fact.round_index), ()), table, days))
            won, lost = won + fact.won, lost + (not fact.won)
    lines.sort(key=lambda line: (line.started_at, line.round_number), reverse=True)
    return lines


def rounds_index(cohorts: ReportCohorts, table: WinProbabilityTable) -> RoundIndex:
    """Every squad round of the period."""
    squad_matches = [*cohorts.select(FactKind.MATCHES, ReportCohort.HISTORY), *cohorts.squad(FactKind.MATCHES)]
    # Squad deaths and squad kills are disjoint (teamkills are left out of both).
    kills = kills_by_round([*cohorts.squad(FactKind.DEATHS), *cohorts.squad(FactKind.KILLS)])
    return RoundIndex(rounds=round_lines(cohorts.squad(FactKind.ROUNDS), kills, table, evening_days(squad_matches)))


def _line(fact: RoundFact, score_before: str, kills: Sequence[KillFact], table: WinProbabilityTable, days: Mapping[str, date]) -> RoundLine:
    best = best_moment(fact, team_states(fact, kills), table)
    return RoundLine(
        match_id=fact.match_id,
        round_number=fact.round_index + 1,
        day=days.get(fact.match_id, fact.started_at.date()),
        started_at=fact.started_at,
        map_name=fact.map_name,
        side=fact.side,
        buy=fact.buy,
        opp_buy=fact.opp_buy,
        score_before=score_before,
        won=fact.won,
        result=fact.result,
        cause=loss_cause(fact),
        max_advantage=fact.max_advantage,
        best_state=best.state if best else None,
        best_probability=round(best.probability, PROBABILITY_DECIMALS) if best else None,
    )
