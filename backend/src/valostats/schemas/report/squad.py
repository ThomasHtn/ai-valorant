"""Escouade view: what the squad wins and loses against the top ranked, counted in rounds."""

from enum import StrEnum

from valostats.schemas.common import ApiModel, Rate
from valostats.schemas.report.tables import StatCell


class Gap(ApiModel):
    """`k` successes out of `n` for the squad, against the top ranked rate in the same situation."""

    k: int
    n: int
    top: float | None
    top_n: int
    # Rounds won (+) or lost (-) against a top ranked team playing the same n rounds: k - n * top.
    rounds: float | None


class MapGap(ApiModel):
    map_name: str
    gap: Gap


class SituationGroup(StrEnum):
    OPENING = "opening"
    ECONOMY = "economy"
    SPIKE = "spike"


class Situation(ApiModel):
    """A situation the squad keeps meeting (5v4, full buy, retake...), over every map and map by map."""

    key: str
    label: str
    # What is counted, e.g. "rounds gagnés après un first blood pour nous".
    detail: str
    group: SituationGroup
    gap: Gap
    maps: list[MapGap]


class MapLine(ApiModel):
    """One map of the pool the squad played: record and rounds won on each side."""

    map_name: str
    matches: int
    wins: int
    attack: Gap
    defense: Gap


class SiteLine(ApiModel):
    """Post-plant or retake on one site of one map."""

    map_name: str
    site: str
    gap: Gap


class RosterLine(ApiModel):
    """A squad player; the top ranked reference of each cell is players of his main role."""

    name: str
    portrait: str
    role: str
    matches: int
    acs: StatCell
    adr: StatCell
    kast: StatCell
    headshots: StatCell
    opening: StatCell
    # First bloods and first deaths, e.g. "14-13".
    opening_record: str
    traded: StatCell


class SquadKpis(ApiModel):
    wins: Rate
    rounds: Gap
    first_duels: Gap
    pistols: Gap
    # Lost rounds the squad had at least a 70 % chance of winning at some point (thrown).
    turning: int
    lost: int


class SquadView(ApiModel):
    kpis: SquadKpis
    situations: list[Situation]
    maps: list[MapLine]
    post_plant: list[SiteLine]
    retakes: list[SiteLine]
    roster: list[RosterLine]
