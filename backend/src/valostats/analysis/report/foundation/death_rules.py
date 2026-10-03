"""Shared definitions of a death, so every view counts "isolated" the same way."""

from valostats.constants.report_domains import ISOLATION_DISTANCE
from valostats.domain.facts import KillFact


def has_living_teammate(kill: KillFact) -> bool:
    """Isolation is only measured when at least one teammate of the victim was still alive."""
    return kill.nearest_teammate is not None


def is_isolated(kill: KillFact) -> bool:
    """No living teammate within the support distance (15 m) when the player died."""
    return kill.nearest_teammate is not None and kill.nearest_teammate > ISOLATION_DISTANCE
