"""One line per facts rebuild; the latest one versions the API caches."""

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from valostats.db.base import Base


class FactsBuild(Base):
    __tablename__ = "facts_build"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    # MatchSource value of the rebuilt facts.
    source: Mapped[str] = mapped_column(String(8))
    matches: Mapped[int] = mapped_column(Integer)
    built_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
