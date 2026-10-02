"""Strengths, weaknesses, recurring first-death spots and evolution of a period."""

from valostats.domain.enums import FindingStatus, Side, Tone
from valostats.schemas.common import ApiModel, Rate, RoundRef


class FindingPlayer(ApiModel):
    name: str
    rate: Rate
    rewatch: list[RoundRef]


class Finding(ApiModel):
    """A gap between the squad and its opponents (or 50 %), confirmed or only a lead.

    A single finding has a `scope` (all maps, a map, a side or a player) and a `squad` rate. A finding
    shared by several players has no scope and lists them in `players`.
    """

    scope: str | None
    metric: str
    label: str
    tone: Tone
    status: FindingStatus
    unit: str
    squad: Rate | None
    # Opponents' rate; null when the squad is tested against 50 %.
    reference: Rate | None
    players: list[FindingPlayer]
    rewatch: list[RoundRef]


class TeamFindings(ApiModel):
    weak_team: list[Finding]
    weak_players: list[Finding]
    strong_team: list[Finding]
    strong_players: list[Finding]


class SummaryItem(ApiModel):
    """One line of the "À retenir" box."""

    scope: str
    label: str
    tone: Tone
    squad: Rate | None
    reference: Rate | None


class SpotPlayer(ApiModel):
    name: str
    count: int


class RecurringSpot(ApiModel):
    """A callout where the squad keeps dying first."""

    map_name: str
    side: Side
    callout: str
    count: int
    revenges: int
    players: list[SpotPlayer]
    rewatch: list[RoundRef]


class EvolutionLine(ApiModel):
    scope: str
    label: str
    current: Rate
    previous: Rate
    better: bool
    # The change survives the false discovery rate correction.
    significant: bool


class Evolution(ApiModel):
    comparison_label: str
    has_previous: bool
    lines: list[EvolutionLine]
