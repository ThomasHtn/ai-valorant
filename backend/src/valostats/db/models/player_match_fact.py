"""Table of `domain.facts.PlayerMatchFact`: one player in one match."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from valostats.db.base import Base


class PlayerMatchFactRow(Base):
    __tablename__ = "player_match_fact"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    match_id: Mapped[str] = mapped_column(ForeignKey("match.id", ondelete="CASCADE"), index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    patch: Mapped[str] = mapped_column(String(16))
    map_name: Mapped[str] = mapped_column(String(32))
    cohort: Mapped[str] = mapped_column(String(8), index=True)
    team_id: Mapped[str] = mapped_column(String(8))
    puuid: Mapped[str] = mapped_column(String(78), index=True)
    name: Mapped[str] = mapped_column(String(64))
    agent: Mapped[str] = mapped_column(String(32))
    rounds: Mapped[int] = mapped_column(Integer)
    won: Mapped[bool] = mapped_column(Boolean)
    score: Mapped[int] = mapped_column(Integer)
    tier_id: Mapped[int | None] = mapped_column(Integer)
    tier_name: Mapped[str | None] = mapped_column(String(32))
    grenade_casts: Mapped[int] = mapped_column(Integer)
    ability1_casts: Mapped[int] = mapped_column(Integer)
    ability2_casts: Mapped[int] = mapped_column(Integer)
    ultimate_casts: Mapped[int] = mapped_column(Integer)
