"""Building blocks shared by every response.

The API returns numbers, never colours or formatted text: a `Rate` carries the raw count and
total, and the front end decides how to display and colour it. Labels that name a statistic or a
situation are in French because they are shown as is.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, computed_field
from pydantic.alias_generators import to_camel


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


class RoundRef(ApiModel):
    """A round to rewatch, e.g. '30/09 Split R14' once formatted."""

    match_id: str
    started_at: datetime
    map_name: str
    round_number: int
