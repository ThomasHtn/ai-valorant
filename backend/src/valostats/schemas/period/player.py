"""Players tab of the period report: roster and individual profiles."""

from datetime import datetime

from valostats.domain.enums import Cohort, Side, Tone
from valostats.schemas.common import ApiModel, DuelMap, LabelledRate, Rate


class StatDefinitionDto(ApiModel):
    key: str
    label: str
    kind: str
    higher_is_better: bool
    decimals: int
    signed: bool
    definition: str


class RosterRow(ApiModel):
    puuid: str
    name: str
    # Whether the player played enough rounds in the period to get a profile.
    has_profile: bool
    matches: int
    acs: float | None
    kd: float | None
    adr: float | None
    kast: float | None
    headshots: float | None
    first_bloods: int
    first_deaths: int
    opening: float | None
    traded: float | None
    impact: float | None


class HeadlineValue(ApiModel):
    value: float | None
    # Same stat over the comparison period; null when the player has too few rounds there.
    previous: float | None


class PlayerHeadline(ApiModel):
    acs: HeadlineValue
    kd: float | None
    adr: HeadlineValue
    kast: HeadlineValue
    headshots: HeadlineValue
    first_bloods: int
    first_deaths: int
    impact: HeadlineValue


class StatGap(ApiModel):
    """A clear gap (p < 0.05) between the player and a reference group."""

    key: str
    label: str
    value: float
    reference: float
    reference_group: Cohort
    tone: Tone


class StatComparison(ApiModel):
    key: str
    value: float | None
    # Opponents of the same matches, and top ranked players on the same agents.
    opponents: float | None
    top: float | None
    # Tone of a clear gap with each reference, neutral otherwise.
    versus_opponents: Tone
    versus_top: Tone


class AgentShare(ApiModel):
    agent: str
    share: Rate


class PlayerFormPoint(ApiModel):
    match_id: str
    started_at: datetime
    map_name: str
    agent: str
    acs: float
    kills: int
    deaths: int


class RoundImpact(ApiModel):
    """Rounds won by the team depending on what the player did in the round."""

    baseline: Rate
    rows: list[LabelledRate]


class SplitRow(ApiModel):
    label: str
    # Match counts are absent on the per-side split (every match has both sides).
    matches: int | None
    wins: int | None
    losses: int | None
    rounds: int
    acs: float | None
    kd: float | None
    adr: float | None
    kast: float | None
    first_bloods: int
    first_deaths: int
    impact: float | None


class WeaponRow(ApiModel):
    weapon: str
    rounds: int
    kills_per_round: float
    top_kills_per_round: float | None
    adr: float
    rounds_won: Rate


class DeathSpotRow(ApiModel):
    map_name: str
    side: Side
    callout: str
    deaths: int
    # Share of the player's deaths on this map and side, and share of these deaths before 25 s.
    share: Rate
    early: Rate


class ClutchSummary(ApiModel):
    # 1v1 to 1v5.
    versus: list[Rate]
    # 1v4 and 1v5 are almost never winnable, so the total stops at 1v3.
    total_up_to_three: Rate


class AbilityUse(ApiModel):
    ability: str
    per_round: float
    top_per_round: float | None
    # Used far less than top ranked players on the same agent.
    under_used: bool


class UtilityRow(ApiModel):
    agent: str
    matches: int
    abilities: list[AbilityUse]


class PlayerProfile(ApiModel):
    puuid: str
    name: str
    comparison_label: str
    matches: int
    wins: int
    losses: int
    rounds: int
    agents: list[AgentShare]
    headline: PlayerHeadline
    strengths: list[StatGap]
    weaknesses: list[StatGap]
    stats: list[StatComparison]
    form: list[PlayerFormPoint]
    top_reference_acs: float | None
    round_impact: RoundImpact
    by_side: list[SplitRow]
    by_agent: list[SplitRow]
    by_map: list[SplitRow]
    weapons: list[WeaponRow]
    death_spots: list[DeathSpotRow]
    clutches: ClutchSummary
    utility: list[UtilityRow]
    duel_maps: list[DuelMap]
