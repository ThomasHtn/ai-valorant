"""Team tab of the period report: one DTO per section.

Reference rates come from top ranked games where the opponents of our own matches would only
mirror the squad's numbers (a duel won by us is a duel lost by them).
"""

from valostats.domain.enums import BuyType, Cohort, Side
from valostats.schemas.common import ApiModel, DuelMap, Rate, RateVsReference


class KpiRate(ApiModel):
    current: Rate
    # Same rate over the comparison period; null without matches to compare with.
    previous: Rate | None


class TeamKpis(ApiModel):
    comparison_label: str
    wins: int
    losses: int
    rounds_won: KpiRate
    attack: KpiRate
    defense: KpiRate
    pistols: Rate
    first_blood: KpiRate
    kast: KpiRate
    traded_deaths: Rate


class MapPoolRow(ApiModel):
    map_name: str
    matches: int
    wins: int
    losses: int
    rounds: Rate
    attack: Rate
    defense: Rate
    pistols: Rate
    first_blood: Rate
    post_plant: Rate
    retake: Rate


class SideRate(ApiModel):
    side: Side
    squad: Rate
    top: Rate


class PistolFollowUp(ApiModel):
    """Rounds 2-3 (or 14-15) after a pistol round won or lost."""

    pistol_won: bool
    rounds_after: int
    squad: Rate
    top: Rate


class BuyMatchup(ApiModel):
    own_buy: BuyType
    opp_buy: BuyType
    squad: Rate
    top: Rate


class BuyShare(ApiModel):
    """How often each buy happens, pistol rounds excluded."""

    cohort: Cohort
    eco: Rate
    force: Rate
    full: Rate


class Economy(ApiModel):
    pistols: list[SideRate]
    after_pistol: list[PistolFollowUp]
    buy_matrix: list[BuyMatchup]
    buy_shares: list[BuyShare]


class OpeningSide(ApiModel):
    side: Side
    first_blood: Rate
    # Round won after taking the first blood (5v4), after suffering it (4v5).
    convert: RateVsReference
    recover: RateVsReference
    median_first_kill_s: float | None


class OpeningPlayer(ApiModel):
    name: str
    first_bloods: int
    won_after_first_blood: Rate
    first_deaths: int
    won_after_first_death: Rate
    first_deaths_traded: Rate


class Opening(ApiModel):
    sides: list[OpeningSide]
    duel_maps: list[DuelMap]
    top_convert: Rate
    top_recover: Rate
    players: list[OpeningPlayer]


class StateRow(ApiModel):
    """Rounds won after going through a numbers situation such as 3v2."""

    state: str
    squad: Rate
    top: Rate


class Situations(ApiModel):
    states: list[StateRow]
    # Rounds lost after leading by 2+ players, rounds won after trailing by 2+.
    throws: RateVsReference
    comebacks: RateVsReference


class SiteRow(ApiModel):
    map_name: str
    site: str
    plant_share: Rate
    top_plant_share: Rate | None
    post_plant: RateVsReference
    plants_against_share: Rate
    retake: RateVsReference


class TempoRow(ApiModel):
    label: str
    share: Rate
    top_share: Rate
    won: Rate
    top_won: Rate


class PlantNumbersRow(ApiModel):
    """Post-plant and retake results by alive players difference when the spike goes down."""

    label: str
    post_plant: Rate
    top_post_plant: Rate
    retake: Rate
    top_retake: Rate


class Sites(ApiModel):
    rows: list[SiteRow]
    tempo: list[TempoRow]
    numbers_at_plant: list[PlantNumbersRow]


class ClutchRow(ApiModel):
    cohort: Cohort
    # 1v1, 1v2, 1v3, 1v4 and more.
    versus: list[Rate]
