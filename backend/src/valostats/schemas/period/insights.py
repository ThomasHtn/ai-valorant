"""Cross-cutting analyses of the team tab: what wins rounds, what goes with wins, evenings, lineups."""

from valostats.schemas.common import ApiModel, MatchRecord, Rate


class DriverRow(ApiModel):
    label: str
    squad: Rate
    top: Rate


class DriverGroup(ApiModel):
    """Round win rate under conditions the team controls or lives through."""

    title: str
    rows: list[DriverRow]


class StatCorrelation(ApiModel):
    """Pearson correlation between a per-match team stat and the share of rounds won in the match."""

    label: str
    r: float | None
    matches: int


class PlayerCorrelation(ApiModel):
    name: str
    matches: int
    r: float | None
    # Mean share of rounds won when the player's ACS is above / below their median.
    win_rate_high_acs: float | None
    win_rate_low_acs: float | None


class Correlations(ApiModel):
    team: list[StatCorrelation]
    players: list[PlayerCorrelation]


class ContextRow(ApiModel):
    label: str
    record: MatchRecord


class PresenceRow(ApiModel):
    name: str
    with_player: MatchRecord
    without_player: MatchRecord


class SessionsContext(ApiModel):
    by_rank_in_evening: list[ContextRow]
    by_start_hour: list[ContextRow]
    by_weekday: list[ContextRow]
    lineups: list[ContextRow]
    presence: list[PresenceRow]


class Composition(ApiModel):
    agents: list[str]
    matches: int
    wins: int


class MapCompositions(ApiModel):
    map_name: str
    squad: list[Composition]
    # Most played composition in top ranked games, with the share of teams playing it.
    top_most_played: list[str] | None
    top_share: Rate | None


class RevengeMatrix(ApiModel):
    """Rows: the player who died. Columns: the teammate who took the revenge (same order as `names`)."""

    names: list[str]
    counts: list[list[int]]
    traded: list[Rate]
