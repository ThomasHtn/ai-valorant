"""Table of `domain.facts.WinProbabilityCell`, one table per match source."""

from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from valostats.db.base import Base


class WinProbabilityRow(Base):
    __tablename__ = "win_probability"

    # MatchSource value: squad matches and top ranked matches have their own table.
    source: Mapped[str] = mapped_column(String(8), primary_key=True)
    own_alive: Mapped[int] = mapped_column(Integer, primary_key=True)
    opp_alive: Mapped[int] = mapped_column(Integer, primary_key=True)
    side: Mapped[str] = mapped_column(String(4), primary_key=True)
    planted: Mapped[bool] = mapped_column(Boolean, primary_key=True)
    wins: Mapped[int] = mapped_column(Integer)
    total: Mapped[int] = mapped_column(Integer)
