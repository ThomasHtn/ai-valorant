"""Leaderboard snapshots."""

from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from valostats.db.models import LeaderboardSnapshot


def add_snapshot(session: Session, region: str, taken_at: datetime, payload: dict[str, Any]) -> None:
    """The caller commits."""
    session.add(LeaderboardSnapshot(region=region, taken_at=taken_at, payload=payload))
