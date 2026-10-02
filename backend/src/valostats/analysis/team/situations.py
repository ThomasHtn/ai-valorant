"""Numbers situations (3v2, 1v1…), throws and comebacks."""

from collections.abc import Sequence

from valostats.analysis.statistics.rates import rate
from valostats.analysis.team.match_results import squad_only
from valostats.constants.analysis import THROW_ADVANTAGE
from valostats.domain.facts import RoundFact
from valostats.schemas.common import RateVsReference
from valostats.schemas.period.team import Situations, StateRow

STATES = ["5v4", "4v5", "4v4", "4v3", "3v4", "3v3", "3v2", "2v3", "2v2", "2v1", "1v2", "1v1"]


def situations(rounds: Sequence[RoundFact], top_rounds: Sequence[RoundFact]) -> Situations:
    squad = squad_only(rounds)
    states = [
        StateRow(
            state=state,
            squad=rate((r for r in squad if state in r.states), lambda r: r.won),
            top=rate((r for r in top_rounds if state in r.states), lambda r: r.won),
        )
        for state in STATES
    ]
    throws = RateVsReference(
        squad=rate((r for r in squad if r.max_advantage >= THROW_ADVANTAGE), lambda r: not r.won),
        reference=rate((r for r in top_rounds if r.max_advantage >= THROW_ADVANTAGE), lambda r: not r.won),
    )
    comebacks = RateVsReference(
        squad=rate((r for r in squad if r.min_advantage <= -THROW_ADVANTAGE), lambda r: r.won),
        reference=rate((r for r in top_rounds if r.min_advantage <= -THROW_ADVANTAGE), lambda r: r.won),
    )
    return Situations(states=states, throws=throws, comebacks=comebacks)
