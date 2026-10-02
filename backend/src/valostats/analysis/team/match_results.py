"""Squad match results rebuilt from round facts."""

from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from datetime import datetime
from typing import Protocol

from valostats.domain.enums import Cohort
from valostats.domain.facts import RoundFact


class HasCohort(Protocol):
    @property
    def cohort(self) -> Cohort: ...


def squad_only[C: HasCohort](rows: Iterable[C]) -> list[C]:
    return [r for r in rows if r.cohort is Cohort.SQUAD]


def opponents_only[C: HasCohort](rows: Iterable[C]) -> list[C]:
    return [r for r in rows if r.cohort is Cohort.OPPONENT]


@dataclass
class MatchResult:
    match_id: str
    map_name: str
    started_at: datetime
    rounds_won: int = 0
    rounds_lost: int = 0

    @property
    def won(self) -> bool:
        return self.rounds_won > self.rounds_lost


def squad_matches(rounds: Sequence[RoundFact]) -> dict[str, MatchResult]:
    """Per squad match: map, date, rounds won and lost."""
    results: dict[str, MatchResult] = {}
    for r in squad_only(rounds):
        result = results.setdefault(r.match_id, MatchResult(r.match_id, r.map_name, r.started_at))
        if r.won:
            result.rounds_won += 1
        else:
            result.rounds_lost += 1
    return results
