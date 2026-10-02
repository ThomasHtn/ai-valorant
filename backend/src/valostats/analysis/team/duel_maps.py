"""Opening duel positions on the minimap."""

from collections.abc import Sequence

from valostats.domain.enums import Side
from valostats.domain.facts import Location, PlayerRoundFact
from valostats.domain.maps import GameMap
from valostats.schemas.common import DuelMap, MinimapPoint


def to_point(game_map: GameMap, location: Location) -> MinimapPoint:
    x, y = game_map.to_minimap(location)
    return MinimapPoint(x=x, y=y)


def duel_map(game_map: GameMap, side: Side | None, player_rounds: Sequence[PlayerRoundFact]) -> DuelMap:
    """First bloods at the killer's position, first deaths at the victim's, for the given player rounds."""
    return DuelMap(
        map_name=game_map.name,
        minimap_url=game_map.minimap_url,
        side=side,
        won=[to_point(game_map, r.first_blood_location) for r in player_rounds if r.first_blood_location],
        lost=[to_point(game_map, r.first_death_location) for r in player_rounds if r.first_death_location],
    )
