"""Points forts et faibles: squad rates tested against a reference, with the rounds at stake.

Labels (`scope`, `metric`) are French because they are shown as is; everything else is codes and
numbers the front formats.
"""

from datetime import date
from enum import StrEnum

from valostats.domain.enums import FindingStatus, LossCause, Reference, Side
from valostats.schemas.common import ApiModel, Rate
from valostats.schemas.report.tables import GameArt


class FindingSide(StrEnum):
    WEAKNESS = "weak"
    STRENGTH = "strong"


class FindingGroup(StrEnum):
    TEAM = "team"
    PLAYERS = "players"


class RewatchRound(ApiModel):
    """A round to rewatch, shown as "30/09 Split R14" and opening the round sheet."""

    match_id: str
    day: date
    map_name: str
    # 1-based; None when the link points to a whole match.
    round_number: int | None


class Finding(ApiModel):
    side: FindingSide
    group: FindingGroup
    # Where the gap is, e.g. "Split · défense", "DuffManBzH", "R3 bonus".
    scope: str
    metric: str
    # What the metric measures (rounds, conversion, revenge, firstDeath...), for icons and filters.
    kind: str
    art: GameArt | None
    # Filters behind the scope, so the front can group findings and open the matching views.
    map_name: str | None
    scope_side: Side | None
    player: str | None
    # Reference the test was run against (top ranked or opponents); the other one is shown too.
    reference: Reference
    squad: Rate
    opp: Rate
    top: Rate
    # Weight of the event on the round, measured in top ranked: P(won | event) - P(won | no event).
    leverage: float
    # Rounds won (+) or lost (-) compared with the reference on the same sample.
    gap_rounds: float
    p_value: float
    status: FindingStatus
    # Distinct matches behind the squad sample, to read the gap per match.
    matches: int
    # Causes of the lost rounds behind a team weakness counted in rounds; empty otherwise.
    lost_causes: dict[LossCause, int]
    rewatch: list[RewatchRound]


class BonusRoundCheck(ApiModel):
    """The third round after a won pistol and second round, checked whatever its p-value."""

    metric: str
    squad: Rate
    opp: Rate
    top: Rate
    hist: Rate
    p_value: float
    gap_rounds: float | None
    # Causes of the bonus rounds the squad lost.
    lost_causes: dict[LossCause, int]
    rewatch: list[RewatchRound]


class FindingsReport(ApiModel):
    # Comparisons tested in the period, all corrected together.
    tests: int
    # False discovery rate of the correction.
    q: float
    findings: list[Finding]
    bonus_round: BonusRoundCheck
