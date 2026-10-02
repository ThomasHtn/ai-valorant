"""Closed sets of values shared by the facts, the database and the API."""

from enum import StrEnum


class Side(StrEnum):
    ATTACK = "att"
    DEFENSE = "def"

    @property
    def opposite(self) -> "Side":
        return Side.DEFENSE if self is Side.ATTACK else Side.ATTACK


class BuyType(StrEnum):
    PISTOL = "pistol"
    ECO = "eco"
    FORCE = "force"
    FULL = "full"


class Cohort(StrEnum):
    """Who a fact belongs to: the squad, its opponents in the same matches, or a top ranked team."""

    SQUAD = "squad"
    OPPONENT = "opp"
    TOP = "top"


class KillerCohort(StrEnum):
    """Cohort of a killer; the environment (spike, fall) kills too."""

    SQUAD = "squad"
    OPPONENT = "opp"
    TOP = "top"
    ENVIRONMENT = "env"


class MatchSource(StrEnum):
    """Why a match was collected."""

    SQUAD = "squad"
    TOP = "top"


class Tone(StrEnum):
    """Whether a value is good or bad news for the squad."""

    GOOD = "good"
    BAD = "bad"
    NEUTRAL = "neutral"


class FindingStatus(StrEnum):
    """Confirmed gaps survive the multiple-testing correction; leads are only worth watching."""

    CONFIRMED = "confirmed"
    LEAD = "lead"
    MIXED = "mixed"
