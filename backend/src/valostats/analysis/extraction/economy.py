"""Buy classification from the team's loadout values."""

from collections.abc import Sequence

from valostats.constants.game import ECO_MAX_LOADOUT, FULL_BUY_MIN_LOADOUT, PISTOL_ROUNDS
from valostats.domain.enums import BuyType


def buy_type(round_index: int, loadouts: Sequence[int]) -> BuyType:
    if round_index in PISTOL_ROUNDS:
        return BuyType.PISTOL
    average = sum(loadouts) / len(loadouts)
    if average >= FULL_BUY_MIN_LOADOUT:
        return BuyType.FULL
    return BuyType.ECO if average < ECO_MAX_LOADOUT else BuyType.FORCE
