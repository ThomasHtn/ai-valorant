"""What the home page and the report header need: the report tree and the summary of a period."""

from datetime import date, datetime
from enum import StrEnum

from valostats.schemas.common import ApiModel


class EveningSummary(ApiModel):
    """One evening of the home tree: its matches with map and score, oldest first."""

    day: date
    matches: int
    wins: int
    losses: int
    maps: list[str]
    # Squad score of each match, e.g. "13-9", in the order of `maps`.
    scores: list[str]
    # Patch of each match, in the order of `maps`: lets a patch period draw its matches.
    patches: list[str]


class MonthSummary(ApiModel):
    key: str
    matches: int
    wins: int
    losses: int
    # Newest first.
    sessions: list[EveningSummary]


class ReportPeriods(ApiModel):
    """The home tree: months and their evenings, patches, and the bounds of the whole history."""

    freshness: datetime | None
    first_day: date | None
    last_day: date | None
    top_matches: int
    # Newest first.
    patches: list[str]
    months: list[MonthSummary]


class PeriodKind(StrEnum):
    MONTH = "month"
    PATCH = "patch"
    RANGE = "range"
    SESSION = "session"


class PatchCount(ApiModel):
    patch: str
    matches: int


class ReportPlayer(ApiModel):
    """A squad player of the period, with the agent he played most (his picture in the front)."""

    name: str
    puuid: str
    # Avatar agent picked in ValoQuests, else the most played agent.
    portrait: str
    role: str


class DataQuality(ApiModel):
    """What the figures of the period rest on; the front writes the sentences."""

    complete_matches: int
    incomplete_matches: int
    lineups: int
    top_matches: int
    top_patches: list[str]
    # Maps of the period without any top ranked match: no top reference there.
    maps_without_top: list[str]


class ReportMeta(ApiModel):
    """Header of a report: the period, its record and the data behind it."""

    key: str
    title: str
    kind: PeriodKind
    matches: int
    wins: int
    losses: int
    rounds: int
    sessions: int
    patches: list[PatchCount]
    maps: list[str]
    players: list[ReportPlayer]
    quality: DataQuality
