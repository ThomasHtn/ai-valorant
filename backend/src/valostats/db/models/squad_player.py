"""Squad members, copied from ValoQuests."""

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from valostats.db.base import Base


class SquadPlayer(Base):
    __tablename__ = "squad_player"

    puuid: Mapped[str] = mapped_column(String(78), primary_key=True)
    name: Mapped[str] = mapped_column(String(64))
    active: Mapped[bool] = mapped_column(Boolean, default=True)
