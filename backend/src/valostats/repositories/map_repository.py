"""Map metadata."""

from collections.abc import Iterable

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from valostats.db.models import GameMapRow
from valostats.domain.maps import Callout, GameMap


def replace_all(session: Session, maps: Iterable[GameMap]) -> None:
    """The caller commits."""
    session.execute(delete(GameMapRow))
    session.add_all(
        GameMapRow(
            name=m.name,
            minimap_url=m.minimap_url,
            x_multiplier=m.x_multiplier,
            y_multiplier=m.y_multiplier,
            x_scalar_to_add=m.x_scalar_to_add,
            y_scalar_to_add=m.y_scalar_to_add,
            callouts=[{"name": c.name, "x": c.x, "y": c.y} for c in m.callouts],
        )
        for m in maps
    )


def load_all(session: Session) -> dict[str, GameMap]:
    return {
        row.name: GameMap(
            name=row.name,
            minimap_url=row.minimap_url,
            x_multiplier=row.x_multiplier,
            y_multiplier=row.y_multiplier,
            x_scalar_to_add=row.x_scalar_to_add,
            y_scalar_to_add=row.y_scalar_to_add,
            callouts=tuple(Callout(c["name"], c["x"], c["y"]) for c in row.callouts),
        )
        for row in session.scalars(select(GameMapRow))
    }
