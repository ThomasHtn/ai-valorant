"""How a finding reads on screen: red says what went wrong, green what went well."""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

from valostats.schemas.common import Rate
from valostats.schemas.period.findings import Noun

if TYPE_CHECKING:
    from valostats.analysis.period.findings import ComparisonTest


@dataclass(frozen=True)
class Reading:
    """A test's label and rates, counting the failures when that matches its colour better."""

    label: str
    # True when the label and every rate count the failures of the metric ("Premiers duels perdus").
    inverted: bool
    squad: Rate
    reference: Rate | None
    top: Rate | None
    by_match: dict[str, Rate]
    # What one match's count and total stand for ("3 throws sur 5 rounds à 2 joueurs d'avance").
    counted: Noun
    tries: Noun


def failures(rate: Rate) -> Rate:
    """The other side of a rate: tries that were not a success."""
    return Rate(count=rate.total - rate.count, total=rate.total)


def read_in_colour(test: ComparisonTest) -> Reading:
    """A weakness on a stat where more is better ("Premiers duels gagnés" in red) reads as its failures."""
    metric = test.metric
    inverted = test.good != metric.higher_is_better and bool(metric.opposite)

    def flip(rate: Rate) -> Rate:
        return failures(rate) if inverted else rate

    return Reading(
        label=metric.opposite if inverted else metric.label,
        inverted=inverted,
        squad=flip(test.squad),
        reference=flip(test.opponents) if test.opponents else None,
        top=flip(test.top) if test.top else None,
        by_match={match_id: flip(rate) for match_id, rate in test.by_match.items()},
        counted=metric.counted[1 if inverted else 0],
        tries=metric.tries,
    )
