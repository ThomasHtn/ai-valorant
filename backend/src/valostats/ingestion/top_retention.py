"""Top ranked retention: only the current patch and the previous one are kept, the game moves too fast for older ones."""

import logging

from sqlalchemy.orm import Session

from valostats.constants.top_collection import KEPT_PATCHES
from valostats.domain.enums import MatchSource
from valostats.domain.patches import patch_sort_key
from valostats.repositories import leaderboard_repository, match_repository

logger = logging.getLogger(__name__)


def purge_old_patches(session: Session) -> None:
    patches = sorted(match_repository.patches(session, MatchSource.TOP), key=patch_sort_key, reverse=True)
    old = patches[KEPT_PATCHES:]
    deleted = match_repository.delete_patches(session, MatchSource.TOP, old)
    oldest = match_repository.earliest_started_at(session, MatchSource.TOP)
    snapshots = leaderboard_repository.delete_before(session, oldest) if oldest else 0
    session.commit()
    if deleted or snapshots:
        logger.info("top ranked patches %s dropped: %d matches, %d leaderboard snapshots", old, deleted, snapshots)
