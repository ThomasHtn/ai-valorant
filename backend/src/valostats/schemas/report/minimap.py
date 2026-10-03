"""Minimap view of one map: points by layer and side, callouts, and a summary per zone.

Coordinates are minimap image positions from 0 to 1 (`domain.maps.GameMap.to_minimap`).
"""

from datetime import date

from valostats.domain.enums import Side
from valostats.schemas.common import ApiModel


class Callout(ApiModel):
    name: str
    x: float
    y: float


class MapPoint(ApiModel):
    """A kill or a death of the squad. `player` is the squad player, `other` the opponent."""

    x: float
    y: float
    player: str
    other: str
    weapon: str | None
    zone: str | None
    # Death avenged by a teammate (deaths) or kill that was avenged by the opponents (kills).
    avenged: bool
    match_id: str
    round_number: int
    day: date


class PlantPoint(ApiModel):
    x: float
    y: float
    site: str | None
    planter: str | None
    # Plant made by the squad (attack) or by the opponents (squad on defense).
    squad_plant: bool
    # Round won by the squad.
    won: bool
    match_id: str
    round_number: int
    day: date


class MinimapLayers(ApiModel):
    first_deaths: list[MapPoint]
    first_bloods: list[MapPoint]
    deaths: list[MapPoint]
    kills: list[MapPoint]
    plants: list[PlantPoint]
    # Deaths with no living teammate within 15 m (at least one teammate still alive).
    isolated_deaths: list[MapPoint]
    # Where the opponent stood when he killed a squad player (x, y and zone of the killer).
    enemy_killer_spots: list[MapPoint]
    rounds: int


class ZoneRef(ApiModel):
    match_id: str
    round_number: int
    day: date
    player: str
    first_death: bool


class PlayerCount(ApiModel):
    name: str
    deaths: int


class ZoneRow(ApiModel):
    zone: str
    first_deaths: int
    deaths: int
    kills: int
    revenge_rate: float | None
    revenge_sample: int
    players: list[PlayerCount]
    # Share of the side's first deaths that happen in this zone, for the squad and the top ranked.
    first_death_share: float | None
    top_first_death_share: float | None
    refs: list[ZoneRef]


class ZoneSummary(ApiModel):
    first_deaths: int
    top_first_deaths: int
    rows: list[ZoneRow]


class MinimapSide(ApiModel):
    layers: MinimapLayers
    zones: ZoneSummary


class MinimapView(ApiModel):
    map_name: str
    minimap_url: str
    callouts: list[Callout]
    sides: dict[Side, MinimapSide]
    # Points dropped because Henrik placed them outside the map (e.g. a player falling off Abyss).
    out_of_map: int
