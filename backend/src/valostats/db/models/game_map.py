"""Map metadata from valorant-api.com (only maps with callouts are kept)."""

from typing import Any

from sqlalchemy import Float, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from valostats.db.base import Base


class GameMapRow(Base):
    __tablename__ = "game_map"

    name: Mapped[str] = mapped_column(String(32), primary_key=True)
    minimap_url: Mapped[str] = mapped_column(String(255))
    x_multiplier: Mapped[float] = mapped_column(Float)
    y_multiplier: Mapped[float] = mapped_column(Float)
    x_scalar_to_add: Mapped[float] = mapped_column(Float)
    y_scalar_to_add: Mapped[float] = mapped_column(Float)
    # List of {"name": "A Tree", "x": ..., "y": ...}.
    callouts: Mapped[list[dict[str, Any]]] = mapped_column(JSONB)
