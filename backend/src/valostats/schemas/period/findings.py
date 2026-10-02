"""Strengths, weaknesses, recurring first-death spots and evolution of a period."""

from valostats.domain.enums import FindingStatus, Side, Tone
from valostats.schemas.common import ApiModel, MatchLink, Rate, RoundRef


class Noun(ApiModel):
    """A word in the singular and the plural, to agree with a count ("1 throw", "3 throws")."""

    one: str
    many: str


class FindingMatch(MatchLink):
    """A match a point is built on, with the point's own figure in that match."""

    rate: Rate


class Finding(ApiModel):
    """A gap between the squad and its opponents (or 50 %), confirmed or only a lead.

    `scope` is all maps, a map, a side, or a player's name for a player's own finding.
    """

    scope: str
    metric: str
    label: str
    tone: Tone
    status: FindingStatus
    # True when the label and every rate count the failures of the metric ("Premiers duels perdus").
    inverted: bool
    unit: str
    # What one match's count and total stand for ("3 throws sur 5 rounds à 2 joueurs d'avance").
    counted: Noun
    tries: Noun
    squad: Rate
    # Opponents' rate; null when the squad is tested against 50 %.
    reference: Rate | None
    # Top ranked rate on the same scope, shown beside the test without being part of it.
    top: Rate | None
    rewatch: list[RoundRef]
    # Matches the squad figure comes from, oldest first.
    matches: list[FindingMatch]


class TeamFindings(ApiModel):
    weak_team: list[Finding]
    weak_players: list[Finding]
    strong_team: list[Finding]
    strong_players: list[Finding]


class SummaryItem(ApiModel):
    """One line of the "À retenir" box."""

    scope: str
    # Metric key of a finding, for its explanation; None for the first-death spot.
    metric: str | None
    label: str
    tone: Tone
    # True when the label and every rate count the failures of the metric ("Premiers duels perdus").
    inverted: bool
    # What the figure counts ('rounds', 'morts', 'duels', 'first deaths').
    unit: str
    # What the count of one match's figure counts, as in "3 throws sur 5".
    counted: Noun
    # What the total of one match's figure counts, as in "sur 5 rounds à 2 joueurs d'avance".
    tries: Noun
    squad: Rate | None
    reference: Rate | None
    top: Rate | None
    matches: list[FindingMatch]


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
