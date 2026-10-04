"""Stored report views (see `services/report_service.py`)."""

from dataclasses import dataclass
from typing import cast

from sqlalchemy import ColumnElement, CursorResult, and_, delete, exists, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from valostats.db.models import ReportSnapshot


@dataclass(frozen=True)
class DataVersion:
    """What every stored view depends on: both facts builds and the source code."""

    squad: int
    top: int
    code: str


@dataclass(frozen=True)
class SnapshotKey:
    period: str
    view: str
    version: DataVersion


def find(session: Session, key: SnapshotKey) -> str | None:
    query = select(ReportSnapshot.payload).where(_matches(key))
    return session.scalars(query).first()


def save(session: Session, key: SnapshotKey, payload: str) -> None:
    """Keep the first payload when two processes compute the same view. Commits."""
    statement = insert(ReportSnapshot).values(
        period=key.period,
        view=key.view,
        squad_version=key.version.squad,
        top_version=key.version.top,
        code_version=key.version.code,
        payload=payload,
    )
    session.execute(statement.on_conflict_do_nothing())
    session.commit()


def exists_for(session: Session, key: SnapshotKey) -> bool:
    return bool(session.scalar(select(exists().where(_matches(key)))))


def delete_other_versions(session: Session, version: DataVersion) -> int:
    """Drop views computed from older facts or code. Commits; returns the rows deleted."""
    current = and_(
        ReportSnapshot.squad_version == version.squad,
        ReportSnapshot.top_version == version.top,
        ReportSnapshot.code_version == version.code,
    )
    result = cast(CursorResult[tuple[()]], session.execute(delete(ReportSnapshot).where(~current)))
    session.commit()
    return result.rowcount


def _matches(key: SnapshotKey) -> ColumnElement[bool]:
    return and_(
        ReportSnapshot.period == key.period,
        ReportSnapshot.view == key.view,
        ReportSnapshot.squad_version == key.version.squad,
        ReportSnapshot.top_version == key.version.top,
        ReportSnapshot.code_version == key.version.code,
    )
