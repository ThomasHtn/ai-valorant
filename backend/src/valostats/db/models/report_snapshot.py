"""Report views computed once per data version and served as stored JSON."""

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from valostats.db.base import Base


class ReportSnapshot(Base):
    __tablename__ = "report_snapshot"
    __table_args__ = (UniqueConstraint("period", "view", "squad_version", "top_version", "code_version"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    # PeriodQuery.key, e.g. '2026-09', 'patch-13.05' or '2026-09-30_2026-09-30'.
    period: Mapped[str] = mapped_column(String(32))
    # View name, e.g. 'findings', 'tables:combat', 'player:getjfox'.
    view: Mapped[str] = mapped_column(String(96))
    # Facts builds (facts_build.id) and source code the payload was computed from.
    squad_version: Mapped[int] = mapped_column(Integer)
    top_version: Mapped[int] = mapped_column(Integer)
    code_version: Mapped[str] = mapped_column(String(16))
    # Response body as sent to the front; text rather than JSONB so it is served without parsing.
    payload: Mapped[str] = mapped_column(Text)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
