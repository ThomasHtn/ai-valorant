"""Table of `domain.facts.RoundFact`: one team in one round."""

from datetime import datetime

from sqlalchemy import ARRAY, Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from valostats.db.base import Base


class RoundFactRow(Base):
    __tablename__ = "round_fact"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    match_id: Mapped[str] = mapped_column(ForeignKey("match.id", ondelete="CASCADE"), index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    patch: Mapped[str] = mapped_column(String(16))
    map_name: Mapped[str] = mapped_column(String(32))
    round_index: Mapped[int] = mapped_column(Integer)
    cohort: Mapped[str] = mapped_column(String(8), index=True)
    team_id: Mapped[str] = mapped_column(String(8))
    side: Mapped[str] = mapped_column(String(4))
    won: Mapped[bool] = mapped_column(Boolean)
    first_kill: Mapped[bool | None] = mapped_column(Boolean)
    buy: Mapped[str] = mapped_column(String(8))
    opp_buy: Mapped[str] = mapped_column(String(8))
    max_advantage: Mapped[int] = mapped_column(Integer)
    min_advantage: Mapped[int] = mapped_column(Integer)
    planted: Mapped[bool] = mapped_column(Boolean)
    plant_site: Mapped[str | None] = mapped_column(String(4))
    advantage_at_plant: Mapped[int | None] = mapped_column(Integer)
    states: Mapped[list[str]] = mapped_column(ARRAY(String(4)))
    result: Mapped[str] = mapped_column(String(32))
    first_kill_ms: Mapped[int | None] = mapped_column(Integer)
    plant_ms: Mapped[int | None] = mapped_column(Integer)
    loadout: Mapped[float] = mapped_column(Float)
    opp_loadout: Mapped[float] = mapped_column(Float)
