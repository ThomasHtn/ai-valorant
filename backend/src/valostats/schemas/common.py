"""Building blocks shared by every response.

The API returns numbers, never colours or formatted text: a `Rate` carries the raw count and
total, and the front end decides how to display and colour it. Labels that name a statistic or a
situation are in French because they are shown as is.
"""

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, computed_field
from pydantic.alias_generators import to_camel

from valostats.domain.enums import Side


class ApiModel(BaseModel):
    """Base of every DTO: JSON keys are camelCase, like the rest of the ValoQuests API."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, frozen=True)


class Rate(ApiModel):
    """`count` successes out of `total` tries; `value` is null when there was no try."""

    count: int
    total: int

    @computed_field  # type: ignore[prop-decorator]
    @property
    def value(self) -> float | None:
        return self.count / self.total if self.total else None


class RateVsReference(ApiModel):
    """A squad rate next to the rate of a reference group (opponents or top ranked)."""

    squad: Rate
    reference: Rate | None


class MatchLink(ApiModel):
    """A squad match and the evening it belongs to, so the front end can open its page."""

    match_id: str
    # Day of the evening (session) the match is part of, which is the session page's address.
    session_day: date
    started_at: datetime
    map_name: str
    rounds_won: int
    rounds_lost: int


class RoundRef(ApiModel):
    """A round to rewatch, e.g. '30/09 Split R14' once formatted."""

    match_id: str
    started_at: datetime
    map_name: str
    round_number: int


class MinimapPoint(ApiModel):
    """Position on the minimap image, both axes from 0 to 1."""

    x: float
    y: float


class DuelMap(ApiModel):
    """Opening duels on a minimap: won at the killer's position, lost at the victim's."""

    map_name: str
    minimap_url: str
    side: Side | None
    won: list[MinimapPoint]
    lost: list[MinimapPoint]


class LabelledRate(ApiModel):
    label: str
    rate: Rate


class MatchRecord(ApiModel):
    """Matches played, won and lost, with the share of rounds won."""

    matches: int
    wins: int
    losses: int
    rounds: Rate


class CenteredRate(ApiModel):
    """A squad rate, its reference, and the value it is coloured against.

    `center` is the reference value when the reference is large enough, otherwise a neutral default.
    """

    squad: Rate
    reference: Rate | None
    center: float
