"""Leaderboard snapshots."""

from datetime import datetime
from typing import Any, cast

from sqlalchemy import CursorResult, delete
from sqlalchemy.orm import Session

from valostats.db.models import LeaderboardSnapshot


def add_snapshot(session: Session, region: str, taken_at: datetime, payload: dict[str, Any]) -> None:
    """The caller commits."""
    session.add(LeaderboardSnapshot(region=region, taken_at=taken_at, payload=payload))


def delete_before(session: Session, when: datetime) -> int:
    """Drop snapshots older than the matches they led to. The caller commits."""
    result = cast(CursorResult[Any], session.execute(delete(LeaderboardSnapshot).where(LeaderboardSnapshot.taken_at < when)))
    return result.rowcount
