"""Rounds view: every round of a period, and the sheet of one round (timeline, 2D replay, economy).

Event texts are French sentences shown as is; causes are enum values the front translates.
"""

from datetime import date, datetime
from enum import StrEnum

from valostats.domain.enums import BuyType, LossCause, Side
from valostats.schemas.common import ApiModel


class RoundLine(ApiModel):
    """One squad round, as listed in the Rounds view and at the top of its sheet."""

    match_id: str
    # 1-based, as shown in game.
    round_number: int
    # Day of the evening the match belongs to.
    day: date
    started_at: datetime
    map_name: str
    side: Side
    buy: BuyType
    opp_buy: BuyType
    # Score of the match right before the round.
    score_before: str
    won: bool
    result: str
    cause: LossCause | None
    max_advantage: int
    # Best live situation of the round (e.g. "5v3") and the squad's chance of winning from it.
    best_state: str | None
    best_probability: float | None
    # Largest fall of the squad's chance in one event (0..1), the round's end included.
    max_drop: float = 0.0
    # Lost after the squad's chance reached THROW_MIN_CHANCE.
    thrown: bool = False


class RoundIndex(ApiModel):
    """Every squad round of the period, newest first. Every round has a sheet (built on demand)."""

    rounds: list[RoundLine]


class EventKind(StrEnum):
    KILL = "kill"
    PLANT = "plant"
    DEFUSE = "defuse"


class PlayerPosition(ApiModel):
    """A player on the minimap (0..1). `alive` is false for the victim of the event."""

    name: str
    squad: bool
    x: float
    y: float
    alive: bool


class RoundEvent(ApiModel):
    ms: int
    kind: EventKind
    # e.g. "Psilonnix tue ka7ba à A Main (Vandal), revenge par getjfox à 0:41".
    text: str
    actor: str
    target: str | None
    weapon: str | None
    zone: str | None
    # The actor plays for the squad (kill, plant or defuse made by the squad).
    squad_actor: bool
    own_alive: int
    opp_alive: int
    # Squad chance of winning the round right after the event (top ranked table).
    win_probability: float
    # Players known at this moment: the snapshot of the event (players alive) plus the victim.
    positions: list[PlayerPosition]


class EconomyLine(ApiModel):
    name: str
    agent: str
    loadout: int
    weapon: str | None
    armor: str | None
    remaining: int


class RoundSheet(ApiModel):
    round: RoundLine
    events: list[RoundEvent]
    squad_economy: list[EconomyLine]
    opp_economy: list[EconomyLine]
