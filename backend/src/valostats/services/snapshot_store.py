"""Stored report views behind a small interface, so the report service can run without a database in tests."""

from sqlalchemy.orm import Session, sessionmaker

from valostats.repositories import snapshot_repository
from valostats.repositories.snapshot_repository import DataVersion, SnapshotKey


class SnapshotStore:
    def __init__(self, session_factory: sessionmaker[Session]) -> None:
        self._session_factory = session_factory

    def find(self, key: SnapshotKey) -> str | None:
        with self._session_factory() as session:
            return snapshot_repository.find(session, key)

    def save(self, key: SnapshotKey, payload: str) -> None:
        with self._session_factory() as session:
            snapshot_repository.save(session, key, payload)

    def exists(self, key: SnapshotKey) -> bool:
        with self._session_factory() as session:
            return snapshot_repository.exists_for(session, key)

    def delete_other_versions(self, version: DataVersion) -> int:
        with self._session_factory() as session:
            return snapshot_repository.delete_other_versions(session, version)
