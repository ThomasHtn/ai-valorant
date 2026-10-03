"""What one comparison of the Points forts et faibles catalogue is made of."""

from collections.abc import Callable
from dataclasses import dataclass
from enum import StrEnum
from typing import Any

from valostats.analysis.report.foundation.cohorts import FactKind, SquadPlayer
from valostats.domain.enums import Reference, Side
from valostats.schemas.report.findings import FindingGroup
from valostats.schemas.report.tables import GameArt

Predicate = Callable[[Any], bool]


class Unit(StrEnum):
    """What a test counts: team rounds, player-rounds, or deaths (kill facts seen from the victim)."""

    ROUNDS = "rounds"
    PLAYER_ROUNDS = "player_rounds"
    DEATHS = "deaths"


UNIT_KIND = {Unit.ROUNDS: FactKind.ROUNDS, Unit.PLAYER_ROUNDS: FactKind.PLAYER_ROUNDS, Unit.DEATHS: FactKind.DEATHS}


def always(_: Any) -> bool:
    return True


@dataclass(frozen=True)
class FindingTest:
    """One comparison: the rate of `success` among the facts passing `among`, in a scope, against a reference."""

    group: FindingGroup
    scope: str
    metric: str
    # Short code of what is measured (rounds, conversion, revenge, firstDeath...).
    kind: str
    unit: Unit
    success: Predicate
    among: Predicate
    reference: Reference
    map_name: str | None = None
    side: Side | None = None
    # Squad facts narrowed to this player; reference facts to players of his main role.
    player: SquadPlayer | None = None
    art: GameArt | None = None
    # The metric is the round result itself (rounds won after...): leverage 1.
    round_outcome: bool = False
