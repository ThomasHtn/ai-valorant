"""Table of `domain.facts.MatchFact`: one team in one match."""

from datetime import datetime

from sqlalchemy import ARRAY, Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from valostats.db.base import Base


class MatchFactRow(Base):
    __tablename__ = "match_fact"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    match_id: Mapped[str] = mapped_column(ForeignKey("match.id", ondelete="CASCADE"), index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    patch: Mapped[str] = mapped_column(String(16))
    map_name: Mapped[str] = mapped_column(String(32))
    cohort: Mapped[str] = mapped_column(String(8), index=True)
    team_id: Mapped[str] = mapped_column(String(8))
    won: Mapped[bool] = mapped_column(Boolean)
    rounds_won: Mapped[int] = mapped_column(Integer)
    rounds_lost: Mapped[int] = mapped_column(Integer)
    start_side: Mapped[str] = mapped_column(String(4))
    lineup: Mapped[list[str]] = mapped_column(ARRAY(String(64)))
    agents: Mapped[list[str]] = mapped_column(ARRAY(String(32)))
    opp_agents: Mapped[list[str]] = mapped_column(ARRAY(String(32)))
    tier: Mapped[float | None] = mapped_column(Float)
    opp_tier: Mapped[float | None] = mapped_column(Float)
    length_ms: Mapped[int | None] = mapped_column(Integer)
    cluster: Mapped[str | None] = mapped_column(String(32))
