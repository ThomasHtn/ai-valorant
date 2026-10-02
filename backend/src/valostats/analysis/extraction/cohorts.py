"""Which cohort each team of a match belongs to."""

from collections.abc import Callable, Collection

from valostats.analysis.extraction.henrik_payload import HenrikMatch, is_team, squad_team
from valostats.domain.enums import Cohort, KillerCohort

CohortOf = Callable[[str], Cohort]


def cohort_labeler(match: HenrikMatch, squad: Collection[str] | None) -> CohortOf | None:
    """Team id to cohort; None for a squad extraction on a match the squad did not 5-stack.

    Without a squad (top ranked matches) both teams are labelled TOP.
    """
    if squad is None:
        return lambda team: Cohort.TOP
    own_team = squad_team(match, squad)
    if own_team is None:
        return None
    return lambda team: Cohort.SQUAD if team == own_team else Cohort.OPPONENT


def killer_cohort(cohort_of: CohortOf, team: str) -> KillerCohort:
    return KillerCohort(cohort_of(team).value) if is_team(team) else KillerCohort.ENVIRONMENT
