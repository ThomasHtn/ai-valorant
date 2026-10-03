"""Squad members."""

from collections.abc import Iterable

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from valostats.db.models import SquadPlayer


def replace_all(session: Session, players: Iterable[tuple[str, str, str | None]]) -> None:
    """Replace the squad with the given (puuid, name, portrait) triples. The caller commits."""
    session.execute(delete(SquadPlayer))
    session.add_all(SquadPlayer(puuid=puuid, name=name, active=True, portrait=portrait) for puuid, name, portrait in players)


def active_puuids(session: Session) -> set[str]:
    return set(session.scalars(select(SquadPlayer.puuid).where(SquadPlayer.active)))


def portraits(session: Session) -> dict[str, str]:
    """Puuid -> avatar agent of the active players who picked one in ValoQuests."""
    players = session.scalars(select(SquadPlayer).where(SquadPlayer.active))
    return {p.puuid: p.portrait for p in players if p.portrait}


def list_active(session: Session) -> list[SquadPlayer]:
    return list(session.scalars(select(SquadPlayer).where(SquadPlayer.active).order_by(SquadPlayer.name)))
