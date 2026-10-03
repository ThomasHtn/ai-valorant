"""Every table, imported here so Alembic sees them all."""

from valostats.db.models.facts_build import FactsBuild
from valostats.db.models.game_map import GameMapRow
from valostats.db.models.kill_fact import KillFactRow
from valostats.db.models.leaderboard import LeaderboardSnapshot
from valostats.db.models.match import Match
from valostats.db.models.match_fact import MatchFactRow
from valostats.db.models.player_match_fact import PlayerMatchFactRow
from valostats.db.models.player_round_fact import PlayerRoundFactRow
from valostats.db.models.round_fact import RoundFactRow
from valostats.db.models.squad_player import SquadPlayer
from valostats.db.models.win_probability import WinProbabilityRow

__all__ = [
    "FactsBuild",
    "GameMapRow",
    "KillFactRow",
    "LeaderboardSnapshot",
    "Match",
    "MatchFactRow",
    "PlayerMatchFactRow",
    "PlayerRoundFactRow",
    "RoundFactRow",
    "SquadPlayer",
    "WinProbabilityRow",
]
