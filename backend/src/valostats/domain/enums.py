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


class FindingStatus(StrEnum):
    """Confirmed gaps survive the multiple-testing correction; leads are only worth watching."""

    CONFIRMED = "confirmed"
    LEAD = "lead"


class KillMeans(StrEnum):
    """What a kill was made with. Henrik leaves Chamber and Neon ultimates unnamed: they count as abilities."""

    WEAPON = "weapon"
    ABILITY = "ability"
    MELEE = "melee"
    SPIKE = "spike"
    FALL = "fall"
    OTHER = "other"


class LossCause(StrEnum):
    """Why a round was lost, computed from its timeline; the first rule that matches wins (see `analysis/report/loss_causes.py`)."""

    LEAD_THROWN = "lead_thrown"
    CLUTCH_LOST = "clutch_lost"
    POST_PLANT_LOST = "post_plant_lost"
    RETAKE_FAILED = "retake_failed"
    OPENING_LOST = "opening_lost"
    ECONOMY_GAP = "economy_gap"
    TIME_OUT = "time_out"
    EXECUTE_FAILED = "execute_failed"
    DUELS_LOST = "duels_lost"


class Reference(StrEnum):
    """What a squad figure is compared with: top ranked games, the opponents of the same matches, or the squad's own history."""

    TOP = "top"
    OPPONENTS = "opp"
    HISTORY = "hist"
    NONE = "none"
