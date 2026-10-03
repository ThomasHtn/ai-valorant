"""Table of `domain.facts.KillFact`: one kill, both players and the situation around it."""

from datetime import datetime

from sqlalchemy import ARRAY, Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from valostats.db.base import Base


class KillFactRow(Base):
    __tablename__ = "kill_fact"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    match_id: Mapped[str] = mapped_column(ForeignKey("match.id", ondelete="CASCADE"), index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    patch: Mapped[str] = mapped_column(String(16))
    map_name: Mapped[str] = mapped_column(String(32))
    round_index: Mapped[int] = mapped_column(Integer)
    ms: Mapped[int] = mapped_column(Integer)
    killer: Mapped[str] = mapped_column(String(64))
    killer_puuid: Mapped[str] = mapped_column(String(78))
    killer_team: Mapped[str] = mapped_column(String(16))
    killer_cohort: Mapped[str] = mapped_column(String(8), index=True)
    victim: Mapped[str] = mapped_column(String(64))
    victim_puuid: Mapped[str] = mapped_column(String(78))
    victim_team: Mapped[str] = mapped_column(String(16))
    # Facts are replaced per cohort through this column (the victim's cohort).
    cohort: Mapped[str] = mapped_column(String(8), index=True)
    victim_side: Mapped[str] = mapped_column(String(4))
    weapon: Mapped[str | None] = mapped_column(String(32))
    means: Mapped[str] = mapped_column(String(8))
    secondary_fire: Mapped[bool] = mapped_column(Boolean)
    assistants: Mapped[list[str]] = mapped_column(ARRAY(String(64)))
    # Locations are flattened: x and y are both set or both null.
    victim_x: Mapped[float] = mapped_column(Float)
    victim_y: Mapped[float] = mapped_column(Float)
    killer_x: Mapped[float | None] = mapped_column(Float)
    killer_y: Mapped[float | None] = mapped_column(Float)
    victim_zone: Mapped[str] = mapped_column(String(64))
    killer_zone: Mapped[str | None] = mapped_column(String(64))
    distance: Mapped[float | None] = mapped_column(Float)
    nearest_teammate: Mapped[float | None] = mapped_column(Float)
    team_spread: Mapped[float | None] = mapped_column(Float)
    opening: Mapped[bool] = mapped_column(Boolean)
    avenged: Mapped[bool] = mapped_column(Boolean)
    avenger: Mapped[str | None] = mapped_column(String(64))
    avenge_ms: Mapped[int | None] = mapped_column(Integer)
    victim_team_alive: Mapped[int] = mapped_column(Integer)
    killer_team_alive: Mapped[int] = mapped_column(Integer)
    post_plant: Mapped[bool] = mapped_column(Boolean)
    victim_damage: Mapped[int] = mapped_column(Integer)
    teamkill: Mapped[bool] = mapped_column(Boolean)
