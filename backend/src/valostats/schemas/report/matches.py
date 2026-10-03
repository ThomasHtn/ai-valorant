"""Matches view: the period's matches grouped by evening, and the detail of one match."""

from datetime import date, datetime

from valostats.domain.enums import BuyType, LossCause, Side
from valostats.schemas.common import ApiModel


class MatchSummary(ApiModel):
    match_id: str
    started_at: datetime
    map_name: str
    won: bool
    rounds_won: int
    rounds_lost: int


class EveningMatches(ApiModel):
    """An evening (session): its day and its matches, oldest first."""

    day: date
    wins: int
    losses: int
    matches: list[MatchSummary]


class MatchList(ApiModel):
    """Evenings of the period, newest first."""

    evenings: list[EveningMatches]


class ScoreboardLine(ApiModel):
    name: str
    agent: str
    # English tier name from Henrik ("Platinum 1"); the front shows the icon and the French name.
    rank: str | None
    acs: float
    kills: int
    deaths: int
    assists: int
    adr: float
    kast: float | None
    headshot_rate: float | None
    first_bloods: int
    first_deaths: int


class RoundStripCell(ApiModel):
    """One round of the match strip, seen from the squad."""

    round_number: int
    side: Side
    won: bool
    buy: BuyType
    opp_buy: BuyType
    result: str
    ceremony: str | None
    cause: LossCause | None
    max_advantage: int
    planted: bool
    plant_site: str | None


class MatchDetail(ApiModel):
    match_id: str
    # Day of the evening the match belongs to.
    day: date
    started_at: datetime
    map_name: str
    patch: str
    won: bool
    rounds_won: int
    rounds_lost: int
    start_side: Side
    length_ms: int | None
    cluster: str | None
    # Average tier id of each team (3 = Iron 1 ... 27 = Radiant).
    tier: float | None
    opp_tier: float | None
    # Best ACS first.
    squad: list[ScoreboardLine]
    opponents: list[ScoreboardLine]
    rounds: list[RoundStripCell]
