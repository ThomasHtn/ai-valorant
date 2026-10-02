"""Map metadata from valorant-api.com: callouts and minimap projection."""

from dataclasses import dataclass

from valostats.domain.facts import Location


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
