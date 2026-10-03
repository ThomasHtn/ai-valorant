"""Reference data: squad, maps and data status."""

from datetime import datetime

from valostats.schemas.common import ApiModel


class SquadPlayerDto(ApiModel):
    puuid: str
    name: str


class GameMapDto(ApiModel):
    name: str
    minimap_url: str


class SourceStatus(ApiModel):
    source: str
    matches: int
    latest_match: datetime | None
    facts_built_at: datetime | None


class DataStatus(ApiModel):
    sources: list[SourceStatus]
