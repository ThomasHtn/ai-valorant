"""Map metadata from valorant-api.com: callouts and minimap projection."""

import math
from dataclasses import dataclass

from valostats.constants.positions import ATTACKER_SPAWN, DEFENDER_SPAWN
from valostats.domain.facts import Location

QUARTER_TURN = 90


@dataclass(frozen=True, slots=True)
class Callout:
    name: str
    x: float
    y: float


@dataclass(frozen=True, slots=True)
class GameMap:
    name: str
    minimap_url: str
    x_multiplier: float
    y_multiplier: float
    x_scalar_to_add: float
    y_scalar_to_add: float
    callouts: tuple[Callout, ...]

    def callout_at(self, location: Location) -> str:
        """Name of the closest callout, e.g. 'A Tree'."""
        best = min(self.callouts, key=lambda c: (c.x - location.x) ** 2 + (c.y - location.y) ** 2)
        return best.name

    def to_minimap(self, location: Location) -> tuple[float, float]:
        """Position on the minimap image, both axes from 0 to 1."""
        # valorant-api convention: game y drives image x, game x drives image y.
        return (
            location.y * self.x_multiplier + self.x_scalar_to_add,
            location.x * self.y_multiplier + self.y_scalar_to_add,
        )

    def attack_up_rotation(self) -> int:
        """Clockwise turn of the minimap (0, 90, 180 or 270 degrees) putting attackers at the bottom, defenders on top."""
        spawns = {c.name: c for c in self.callouts}
        attack, defense = spawns.get(ATTACKER_SPAWN), spawns.get(DEFENDER_SPAWN)
        if attack is None or defense is None:
            return 0
        ax, ay = self.to_minimap(Location(attack.x, attack.y))
        dx, dy = self.to_minimap(Location(defense.x, defense.y))
        if (ax, ay) == (dx, dy):
            # Maps without a projection (modes outside competitive).
            return 0
        # Image y grows downwards, so "up" is -90 degrees; a clockwise turn adds to the angle.
        angle = math.degrees(math.atan2(dy - ay, dx - ax))
        return round((-90 - angle) / QUARTER_TURN) % 4 * QUARTER_TURN
