"""Maps tab of the period report: everything about one map, against top ranked games on it."""

from valostats.domain.enums import Side
from valostats.schemas.common import ApiModel, CenteredRate, DuelMap, Rate, RoundRef
from valostats.schemas.period.findings import Finding
from valostats.schemas.period.insights import Composition


class MapKpi(ApiModel):
    # Stable identifier, used by clients to attach an explanation to the tile.
    key: str
    label: str
    squad: Rate
    # Top ranked rate on the same map; null when the map is out of their pool.
    top: Rate | None


class MapSiteRow(ApiModel):
    site: str
    # Share of the squad's plants (attack) or of the plants suffered (defense) on this site.
    share: Rate
    top_share: Rate | None
    # Post-plant won (attack) or retake won (defense).
    result: CenteredRate


class FirstDeathSpot(ApiModel):
    callout: str
    first_deaths: int
    first_bloods: int


class MapSide(ApiModel):
    side: Side
    sites: list[MapSiteRow]
    convert: CenteredRate
    recover: CenteredRate
    # Attack: rounds without plant; defense: rounds without an opponent plant (eco rounds excluded).
    no_plant: Rate
    top_no_plant: Rate | None
    duel_map: DuelMap
    first_death_spots: list[FirstDeathSpot]


class TopComposition(ApiModel):
    agents: list[str]
    share: Rate
    wins: Rate


class AgentPresence(ApiModel):
    agent: str
    presence: Rate
    wins: Rate


class MapCompositionsDetail(ApiModel):
    squad: list[Composition]
    top: list[TopComposition]
    top_agents: list[AgentPresence]


class MapPlayerRow(ApiModel):
    name: str
    main_agent: str
    matches: int
    acs: float | None
    kd: float | None
    adr: float | None
    kast: float | None
    first_bloods: int
    first_deaths: int
    impact: float | None


class MapSheet(ApiModel):
    map_name: str
    minimap_url: str
    matches: int
    wins: int
    losses: int
    rounds: int
    top_matches: int
    has_top_reference: bool
    kpis: list[MapKpi]
    findings: list[Finding]
    sides: list[MapSide]
    compositions: MapCompositionsDetail
    players: list[MapPlayerRow]
    throws: int
    throw_rewatch: list[RoundRef]
