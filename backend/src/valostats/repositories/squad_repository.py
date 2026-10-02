"""Squad members."""

from collections.abc import Iterable

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from valostats.db.models import SquadPlayer


def replace_all(session: Session, players: Iterable[tuple[str, str]]) -> None:
    """Replace the squad with the given (puuid, name) pairs. The caller commits."""
    session.execute(delete(SquadPlayer))
    session.add_all(SquadPlayer(puuid=puuid, name=name, active=True) for puuid, name in players)


def active_puuids(session: Session) -> set[str]:
    return set(session.scalars(select(SquadPlayer.puuid).where(SquadPlayer.active)))


def list_active(session: Session) -> list[SquadPlayer]:
    return list(session.scalars(select(SquadPlayer).where(SquadPlayer.active).order_by(SquadPlayer.name)))
