"""Table of `domain.facts.DeathFact`: one death, seen from the victim's team."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from valostats.db.base import Base


class DeathFactRow(Base):
    __tablename__ = "death_fact"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    match_id: Mapped[str] = mapped_column(ForeignKey("match.id", ondelete="CASCADE"), index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    patch: Mapped[str] = mapped_column(String(16))
    map_name: Mapped[str] = mapped_column(String(32))
    round_index: Mapped[int] = mapped_column(Integer)
    cohort: Mapped[str] = mapped_column(String(8), index=True)
    team_id: Mapped[str] = mapped_column(String(8))
    name: Mapped[str] = mapped_column(String(64))
    side: Mapped[str] = mapped_column(String(4))
    ms: Mapped[int] = mapped_column(Integer)
    opening: Mapped[bool] = mapped_column(Boolean)
    traded: Mapped[bool] = mapped_column(Boolean)
    avenger: Mapped[str | None] = mapped_column(String(64))
    callout: Mapped[str] = mapped_column(String(64))
    damage: Mapped[int] = mapped_column(Integer)
    post_plant: Mapped[bool] = mapped_column(Boolean)
    killer: Mapped[str] = mapped_column(String(64))
    killer_cohort: Mapped[str] = mapped_column(String(8))
    teamkill: Mapped[bool] = mapped_column(Boolean)
