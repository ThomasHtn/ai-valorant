"""Raw match storage."""

from collections.abc import Collection, Iterable
from datetime import datetime
from typing import Any, cast

from sqlalchemy import CursorResult, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from valostats.analysis.extraction import henrik_payload as payload
from valostats.analysis.extraction.henrik_payload import HenrikMatch
from valostats.db.models import Match
from valostats.domain.enums import MatchSource


def save(session: Session, match: HenrikMatch, source: MatchSource) -> bool:
    """Store a match unless it is already known; returns whether it was new. The caller commits."""
    statement = (
        insert(Match)
        .values(
            id=payload.match_id(match),
            source=source.value,
            region=payload.region(match),
            started_at=payload.started_at(match),
            map_name=payload.map_name(match),
            patch=payload.patch(match),
            payload=match,
        )
        .on_conflict_do_nothing(index_elements=[Match.id])
    )
    result = cast(CursorResult[Any], session.execute(statement))
    return bool(result.rowcount)


def known_ids(session: Session, ids: Collection[str]) -> set[str]:
    return set(session.scalars(select(Match.id).where(Match.id.in_(ids)))) if ids else set()


def load_payloads(session: Session, source: MatchSource) -> list[HenrikMatch]:
    """Every payload of a source, oldest first."""
    return list(session.scalars(select(Match.payload).where(Match.source == source.value).order_by(Match.started_at)))


def load_payloads_by_ids(session: Session, ids: Iterable[str]) -> list[HenrikMatch]:
    return list(session.scalars(select(Match.payload).where(Match.id.in_(list(ids))).order_by(Match.started_at)))


def count_by_patch_and_map(session: Session, source: MatchSource) -> list[tuple[str, str, int]]:
    query = (
        select(Match.patch, Match.map_name, func.count())
        .where(Match.source == source.value)
        .group_by(Match.patch, Match.map_name)
        .order_by(Match.patch, func.count().desc())
    )
    return [(p, m, n) for p, m, n in session.execute(query)]


def latest_started_at(session: Session, source: MatchSource) -> datetime | None:
    return session.scalar(select(func.max(Match.started_at)).where(Match.source == source.value))
