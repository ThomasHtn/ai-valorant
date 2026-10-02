"""Top ranked collection: the first visible players of each region's leaderboard, their recent competitive matches."""

import logging
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy.orm import Session

from valostats.analysis.extraction.henrik_payload import match_id
from valostats.clients.henrik_client import HenrikClient
from valostats.constants.henrik import TOP_HISTORY_PAGE_SIZE, TOP_PLAYERS_PER_REGION, TOP_REGIONS, TOP_WINDOW_DAYS
from valostats.domain.enums import MatchSource
from valostats.ingestion.facts_rebuild import rebuild_facts
from valostats.repositories import leaderboard_repository, match_repository

logger = logging.getLogger(__name__)


def sync_top(session: Session, henrik: HenrikClient) -> None:
    since = datetime.now(UTC) - timedelta(days=TOP_WINDOW_DAYS)
    stored_this_run: set[str] = set()
    for region in TOP_REGIONS:
        players = _top_players(session, henrik, region)
        new = sum(_sync_player(session, henrik, region, p["puuid"], since, stored_this_run) for p in players)
        logger.info("%s: %d players, %d new matches", region, len(players), new)
    rebuild_facts(session, MatchSource.TOP)


def _top_players(session: Session, henrik: HenrikClient, region: str) -> list[dict[str, Any]]:
    """First players of the leaderboard; anonymized or banned ones are replaced by the next."""
    board = henrik.leaderboard(region)
    if not board:
        return []
    leaderboard_repository.add_snapshot(session, region, datetime.now(UTC), board)
    session.commit()
    visible = [p for p in board["players"] if p["puuid"] and not p["is_anonymized"] and not p["is_banned"]]
    return visible[:TOP_PLAYERS_PER_REGION]


def _sync_player(session: Session, henrik: HenrikClient, region: str, puuid: str, since: datetime, stored_this_run: set[str]) -> int:
    """Page through the player's history until the window, its end, or matches stored by a previous run."""
    new, start = 0, 0
    while True:
        page = henrik.competitive_history(puuid, region, TOP_HISTORY_PAGE_SIZE, start)
        fresh = [m for m in page if _started_utc(m) >= since]
        from_previous_run = 0
        for match in fresh:
            if match_repository.save(session, match, MatchSource.TOP):
                session.commit()
                stored_this_run.add(match_id(match))
                new += 1
            elif match_id(match) not in stored_this_run:
                from_previous_run += 1
        # Matches stored earlier in this run come from a duo partner and do not mean we caught up.
        if len(page) < TOP_HISTORY_PAGE_SIZE or len(fresh) < len(page) or from_previous_run == len(page):
            return new
        start += TOP_HISTORY_PAGE_SIZE


def _started_utc(match: dict[str, Any]) -> datetime:
    return datetime.fromisoformat(match["metadata"]["started_at"].replace("Z", "+00:00"))
