"""Domain "Comportement": inactive rounds and penalties of each player, read round by round.

Henrik's match-level behaviour (AFK rounds, rounds in spawn, friendly fire) contradicts its own
round flags or is always 0, so only the per-round `afk` and `penalty` flags are used.
"""

from collections.abc import Sequence

from valostats.analysis.report.foundation.cells import fixed
from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohorts
from valostats.analysis.report.foundation.table_builder import TableBuilder
from valostats.domain.facts import PlayerRoundFact
from valostats.schemas.report.tables import StatTable


def tables(cohorts: ReportCohorts) -> list[StatTable]:
    table = (
        TableBuilder("behavior-players", "Comportement par joueur", "Joueur", help="behavior")
        .count_column("matches", "Matchs")
        .count_column("rounds", "Rounds")
        .count_column("afk", "Rounds inactifs", help="afkRounds")
        .count_column("penalty", "Pénalités", help="penalties")
    )
    for player in cohorts.players():
        rounds: Sequence[PlayerRoundFact] = [r for r in cohorts.squad(FactKind.PLAYER_ROUNDS) if r.name == player.name]
        table.row(
            player.name,
            player.name,
            {
                "matches": fixed(len({r.match_id for r in rounds})),
                "rounds": fixed(len(rounds)),
                "afk": fixed(sum(r.afk for r in rounds), len(rounds)),
                "penalty": fixed(sum(r.penalty for r in rounds), len(rounds)),
            },
        )
    return [table.build()]
