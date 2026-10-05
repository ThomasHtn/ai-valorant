"""Maps seen in top ranked competitive histories: the competitive queue only serves the current pool."""

from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from valostats.db.base import Base


class CompetitiveMapRow(Base):
    __tablename__ = "competitive_map"

    name: Mapped[str] = mapped_column(String(32), primary_key=True)
    # Start of the latest top ranked match seen on the map, stored or skipped by the quotas.
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
