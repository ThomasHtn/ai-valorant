"""Top-level responses of the period endpoints."""

from datetime import date

from valostats.schemas.common import ApiModel, MatchLink
from valostats.schemas.period.findings import Evolution, RecurringSpot, SummaryItem, TeamFindings
from valostats.schemas.period.insights import Correlations, DriverGroup, MapCompositions, RevengeMatrix, SessionsContext
from valostats.schemas.period.player import RosterRow
from valostats.schemas.period.team import ClutchRow, Economy, MapPoolRow, Opening, Sites, Situations, TeamKpis


class AvailablePeriods(ApiModel):
    months: list[str]
    patches: list[str]
    first_day: date | None
    last_day: date | None


class PlayerLink(ApiModel):
    puuid: str
    name: str
    main_agent: str  # most played agent over the period, for the player's portrait


class PeriodOverview(ApiModel):
    """What the period covers, to build the report's navigation."""

    key: str
    title: str
    comparison_label: str
    matches: int
    top_reference_matches: int
    # Maps played by the squad, most played first.
    maps: list[str]
    # Players with enough rounds for a profile, most rounds first.
    players: list[PlayerLink]


class TeamReport(ApiModel):
    summary: list[SummaryItem]
    kpis: TeamKpis
    # Squad matches of the period, newest first.
    matches: list[MatchLink]
    map_pool: list[MapPoolRow]
    findings: TeamFindings
    round_drivers: list[DriverGroup]
    correlations: Correlations
    economy: Economy
    opening: Opening
    situations: Situations
    sites: Sites
    clutches: list[ClutchRow]
    revenge: RevengeMatrix
    compositions: list[MapCompositions]
    sessions_context: SessionsContext
    recurring_spots: list[RecurringSpot]
    roster: list[RosterRow]
    evolution: Evolution
