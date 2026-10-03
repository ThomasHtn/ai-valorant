"""Distribution view: histograms of the squad in the period against top ranked."""

from valostats.schemas.common import ApiModel


class HistogramBin(ApiModel):
    start: float
    # None for the last, open bin ("90+ s").
    end: float | None
    label: str


class Histogram(ApiModel):
    counts: list[int]
    # Counts divided by `n`, so two samples of different sizes compare; None when empty.
    shares: list[float | None]
    n: int
    median: float | None


class PlayerHistogram(ApiModel):
    name: str
    role: str
    squad: Histogram
    # Top ranked players of the same role.
    top: Histogram


class Distribution(ApiModel):
    key: str
    label: str
    unit: str
    bin_size: float
    bins: list[HistogramBin]
    squad: Histogram
    top: Histogram
    # Per squad player (ACS per match only).
    players: list[PlayerHistogram] | None = None
