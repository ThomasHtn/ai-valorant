"""Clutch success by number of opponents, for the squad, its opponents and top ranked players."""

from collections.abc import Sequence

from valostats.analysis.statistics.rates import rate
from valostats.analysis.team.match_results import opponents_only, squad_only
from valostats.domain.enums import Cohort
from valostats.domain.facts import PlayerRoundFact
from valostats.schemas.period.team import ClutchRow


def clutches(player_rounds: Sequence[PlayerRoundFact], top_player_rounds: Sequence[PlayerRoundFact]) -> list[ClutchRow]:
    groups = ((Cohort.SQUAD, squad_only(player_rounds)), (Cohort.OPPONENT, opponents_only(player_rounds)), (Cohort.TOP, top_player_rounds))
    return [
        ClutchRow(
            cohort=cohort,
            versus=[rate((r for r in rows if r.clutch_versus == n), lambda r: r.clutch_won) for n in (1, 2, 3)]
            + [rate((r for r in rows if r.clutch_versus >= 4), lambda r: r.clutch_won)],
        )
        for cohort, rows in groups
    ]
