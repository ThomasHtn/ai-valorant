"""The current competitive map pool, from the maps seen in top ranked histories."""

from collections.abc import Mapping
from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from valostats.constants.top_collection import POOL_STALE_DAYS
from valostats.db.models import CompetitiveMapRow, Match
from valostats.domain.enums import MatchSource
from valostats.domain.patches import patch_sort_key


def record_sightings(session: Session, last_seen: Mapping[str, datetime]) -> None:
    """Keep the latest start seen per map. The caller commits."""
    if not last_seen:
        return
    statement = insert(CompetitiveMapRow).values([{"name": m, "last_seen_at": t} for m, t in last_seen.items()])
    statement = statement.on_conflict_do_update(
        index_elements=[CompetitiveMapRow.name],
        set_={"last_seen_at": func.greatest(CompetitiveMapRow.last_seen_at, statement.excluded.last_seen_at)},
    )
    session.execute(statement)


def current_pool(session: Session) -> frozenset[str]:
    """Maps played recently in top ranked competitive; before any sighting, the maps of the latest top ranked patch."""
    rows = list(session.execute(select(CompetitiveMapRow.name, CompetitiveMapRow.last_seen_at)))
    if rows:
        latest = max(t for _, t in rows)
        return frozenset(name for name, t in rows if t >= latest - timedelta(days=POOL_STALE_DAYS))
    patches = list(session.scalars(select(Match.patch).where(Match.source == MatchSource.TOP.value).distinct()))
    if not patches:
        return frozenset()
    latest_patch = max(patches, key=patch_sort_key)
    query = select(Match.map_name).where(Match.source == MatchSource.TOP.value, Match.patch == latest_patch).distinct()
    return frozenset(session.scalars(query))
