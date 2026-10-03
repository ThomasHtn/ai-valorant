"""Tendance view: squad and player figures over the whole history, by month, by patch and by match."""

from datetime import date

from valostats.schemas.common import ApiModel
from valostats.schemas.report.tables import ValueFormat


class TrendMetric(ApiModel):
    """A metric the analyst can plot, with its top ranked value when that reference means something."""

    key: str
    label: str
    format: ValueFormat
    # 1 higher is better, -1 lower is better.
    better: int
    help: str | None
    # None for symmetric metrics (rounds won, pistols, first blood taken): top ranked is always 50 %.
    top: float | None


class TrendValue(ApiModel):
    v: float | None
    # Sample behind the value (rounds, deaths, player-rounds, shots).
    n: int


class TrendPoint(ApiModel):
    """The squad over one month or one patch."""

    key: str
    matches: int
    wins: int
    # Metric key -> value; keys are those of `Trends.metrics`.
    values: dict[str, TrendValue]
    # The point covers the studied period (highlighted in the chart).
    in_period: bool


class PlayerTrendPoint(ApiModel):
    key: str
    values: dict[str, TrendValue]
    in_period: bool


class PlayerTrend(ApiModel):
    name: str
    role: str
    # Top ranked players of the same role: metric key -> value.
    top: dict[str, float | None]
    by_month: list[PlayerTrendPoint]


class MatchPoint(ApiModel):
    """One squad match of the history, oldest first."""

    index: int
    match_id: str
    day: date
    map_name: str
    patch: str
    won: bool
    rounds_won: int
    rounds_lost: int
    # Player name -> ACS of the match.
    acs: dict[str, float]
    patch_change: bool
    in_period: bool


class PatchMarker(ApiModel):
    index: int
    patch: str
    day: date


class Trends(ApiModel):
    metrics: list[TrendMetric]
    player_metrics: list[TrendMetric]
    # Oldest first.
    by_month: list[TrendPoint]
    by_patch: list[TrendPoint]
    players: list[PlayerTrend]
    series: list[MatchPoint]
    patch_markers: list[PatchMarker]
