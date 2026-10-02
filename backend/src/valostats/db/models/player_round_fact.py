"""Table of `domain.facts.PlayerRoundFact`: one player in one round."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from valostats.db.base import Base


class PlayerRoundFactRow(Base):
    __tablename__ = "player_round_fact"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    match_id: Mapped[str] = mapped_column(ForeignKey("match.id", ondelete="CASCADE"), index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    patch: Mapped[str] = mapped_column(String(16))
    map_name: Mapped[str] = mapped_column(String(32))
    round_index: Mapped[int] = mapped_column(Integer)
    cohort: Mapped[str] = mapped_column(String(8), index=True)
    side: Mapped[str] = mapped_column(String(4))
    puuid: Mapped[str] = mapped_column(String(78), index=True)
    name: Mapped[str] = mapped_column(String(64))
    agent: Mapped[str] = mapped_column(String(32))
    won: Mapped[bool] = mapped_column(Boolean)
    match_won: Mapped[bool] = mapped_column(Boolean)
    kills: Mapped[int] = mapped_column(Integer)
    deaths: Mapped[int] = mapped_column(Integer)
    assists: Mapped[int] = mapped_column(Integer)
    score: Mapped[int] = mapped_column(Integer)
    damage: Mapped[int] = mapped_column(Integer)
    headshots: Mapped[int] = mapped_column(Integer)
    bodyshots: Mapped[int] = mapped_column(Integer)
    legshots: Mapped[int] = mapped_column(Integer)
    survived: Mapped[bool] = mapped_column(Boolean)
    traded: Mapped[bool] = mapped_column(Boolean)
    kast: Mapped[bool] = mapped_column(Boolean)
    revenge_given: Mapped[int] = mapped_column(Integer)
    first_blood: Mapped[bool] = mapped_column(Boolean)
    first_death: Mapped[bool] = mapped_column(Boolean)
    # Locations are flattened: x and y are both set or both null.
    first_blood_x: Mapped[float | None] = mapped_column(Float)
    first_blood_y: Mapped[float | None] = mapped_column(Float)
    first_death_x: Mapped[float | None] = mapped_column(Float)
    first_death_y: Mapped[float | None] = mapped_column(Float)
    clutch_versus: Mapped[int] = mapped_column(Integer)
    clutch_won: Mapped[bool] = mapped_column(Boolean)
    win_probability_added: Mapped[float] = mapped_column(Float)
    death_ms: Mapped[int | None] = mapped_column(Integer)
    zero_damage_death: Mapped[bool] = mapped_column(Boolean)
    weapon: Mapped[str | None] = mapped_column(String(32))
    death_callout: Mapped[str | None] = mapped_column(String(64))
