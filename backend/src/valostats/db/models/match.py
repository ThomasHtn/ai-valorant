"""Raw matches as returned by Henrik: the source of truth every fact is rebuilt from."""

from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from valostats.db.base import Base


class Match(Base):
    __tablename__ = "match"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    # MatchSource value: "squad" or "top".
    source: Mapped[str] = mapped_column(String(8), index=True)
    region: Mapped[str] = mapped_column(String(8))
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    map_name: Mapped[str] = mapped_column(String(32))
    patch: Mapped[str] = mapped_column(String(16))
    # Full Henrik v4 match payload.
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB)
    imported_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
