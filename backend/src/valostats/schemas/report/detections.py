"""Automatic detections: what repeats across matches and links between figures."""

from enum import StrEnum

from pydantic import Field

from valostats.domain.enums import LossCause, Side
from valostats.schemas.common import ApiModel, Rate
from valostats.schemas.report.findings import RewatchRound
from valostats.schemas.report.tables import GameArt


class RepetitionKind(StrEnum):
    ZONE_FIRST_DEATHS = "zone_first_deaths"
    LOSS_CAUSE = "loss_cause"
    SITUATION_LOST = "situation_lost"


class PlayerCount(ApiModel):
    name: str
    count: int


class Repetition(ApiModel):
    """The same thing happening again and again: first deaths in one zone, a cause of lost rounds, a lost situation."""

    kind: RepetitionKind
    # Short French label ("6 first deaths à A Stairs") and its scope ("Lotus · défense").
    label: str
    scope: str
    art: GameArt | None
    map_name: str | None
    side: Side | None
    count: int
    matches: int
    # Rounds of the scope the count rests on (rounds on that map and side, or rounds reaching the state).
    base_rounds: int
    # Zone first deaths: zone, share of the scope's first deaths, same share in top ranked, avenged ones, players.
    zone: str | None = None
    share: float | None = None
    top_share: float | None = None
    avenged: int | None = None
    players: list[PlayerCount] = Field(default_factory=list)
    # Loss cause repetitions.
    cause: LossCause | None = None
    # Situation lost: the "XvY" state, share of those rounds lost, same share for the opponents.
    state: str | None = None
    lost_share: float | None = None
    opp_lost_share: float | None = None
    opp_rounds: int | None = None
    rewatch: list[RewatchRound]


class LinkKind(StrEnum):
    FIRST_BLOOD = "first_blood"
    FIRST_DEATH = "first_death"
    ACS_MEDIAN = "acs_median"


class AcsGroup(ApiModel):
    """Rounds the team won in a player's matches above (or below) his median ACS."""

    rounds: Rate
    matches: int
    match_wins: int


class Link(ApiModel):
    """How the round result moves with what one player does."""

    kind: LinkKind
    player: str
    art: GameArt
    label: str
    p_value: float
    # First blood / first death: the team's rounds won after his event, against the team's baseline.
    value: Rate | None = None
    team: Rate | None = None
    gap_rounds: float | None = None
    # ACS median: his median ACS and the team's rounds won above and below it.
    median_acs: float | None = None
    above: AcsGroup | None = None
    below: AcsGroup | None = None
    rewatch: list[RewatchRound]


class Detections(ApiModel):
    repetitions: list[Repetition]
    links: list[Link]
