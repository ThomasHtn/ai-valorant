"""Top ranked collection: the first visible players of each region's leaderboard, their recent competitive matches.

Every night, until each map of the current pool holds its quota for the current patch. EU players
come first and go deeper in the leaderboard; other regions only fill what EU leaves. Once every map
is full, a few EU players are still read to notice a new patch or a change of map pool.
"""

import logging
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy.orm import Session

from valostats.analysis.extraction import henrik_payload as payload
from valostats.clients.henrik_client import HenrikClient
from valostats.constants.henrik import TOP_HISTORY_PAGE_SIZE, TOP_PLAYERS_DEFAULT, TOP_PLAYERS_PER_REGION, TOP_REGIONS, TOP_WINDOW_DAYS
from valostats.constants.top_collection import EU_REGION, PROBE_PLAYERS
from valostats.domain.enums import MatchSource
from valostats.ingestion.facts_rebuild import rebuild_facts
from valostats.ingestion.top_quota import TopQuota
from valostats.ingestion.top_retention import purge_old_patches
from valostats.repositories import leaderboard_repository, map_pool_repository, match_repository

logger = logging.getLogger(__name__)


@dataclass
class _Run:
    since: datetime
    quota: TopQuota
    pool: frozenset[str]
    # Matches already handled this run (a duo partner brings the same ones).
    seen: set[str] = field(default_factory=set)
    # Latest start seen per map, stored or not: tells the current map pool.
    last_seen: dict[str, datetime] = field(default_factory=dict)


def sync_top(session: Session, henrik: HenrikClient) -> None:
    run = _Run(
        since=datetime.now(UTC) - timedelta(days=TOP_WINDOW_DAYS),
        quota=TopQuota.load(session),
        pool=map_pool_repository.current_pool(session),
    )
    for region in TOP_REGIONS:
        # EU is always read, at least a few players: it is how a new patch or pool shows up.
        if region != EU_REGION and run.quota.full(run.pool, region):
            continue
        players = _top_players(session, henrik, region)
        new = 0
        for n, player in enumerate(players):
            if run.quota.full(run.pool, region) and (region != EU_REGION or n >= PROBE_PLAYERS):
                break
            new += _sync_player(session, henrik, region, player["puuid"], run)
        logger.info("%s: %d new matches", region, new)
    map_pool_repository.record_sightings(session, run.last_seen)
    session.commit()
    logger.info("patch %s, stored per map: %s", run.quota.patch, dict(run.quota.stored))
    purge_old_patches(session)
    rebuild_facts(session, MatchSource.TOP)


def _top_players(session: Session, henrik: HenrikClient, region: str) -> list[dict[str, Any]]:
    """First players of the leaderboard; anonymized or banned ones are replaced by the next."""
    board = henrik.leaderboard(region)
    if not board:
        return []
    leaderboard_repository.add_snapshot(session, region, datetime.now(UTC), board)
    session.commit()
    visible = [p for p in board["players"] if p["puuid"] and not p["is_anonymized"] and not p["is_banned"]]
    return visible[: TOP_PLAYERS_PER_REGION.get(region, TOP_PLAYERS_DEFAULT)]


def _sync_player(session: Session, henrik: HenrikClient, region: str, puuid: str, run: _Run) -> int:
    """Page through the player's history until the window, its end, or a page stored by a previous run."""
    new, start = 0, 0
    while True:
        page = henrik.competitive_history(puuid, region, TOP_HISTORY_PAGE_SIZE, start)
        fresh = [m for m in page if _started_utc(m) >= run.since]
        known = match_repository.known_ids(session, [payload.match_id(m) for m in fresh])
        for match in fresh:
            new += _consider(session, match, region, run, known)
        if len(page) < TOP_HISTORY_PAGE_SIZE or len(fresh) < len(page) or len(known) == len(page):
            return new
        start += TOP_HISTORY_PAGE_SIZE


def _consider(session: Session, match: dict[str, Any], region: str, run: _Run, known: set[str]) -> int:
    """Store the match if its map and region still have room; returns 1 when stored."""
    match_id = payload.match_id(match)
    if match_id in run.seen:
        return 0
    run.seen.add(match_id)
    map_name, started = payload.map_name(match), _started_utc(match)
    run.last_seen[map_name] = max(started, run.last_seen.get(map_name, started))
    if match_id in known:
        return 0
    match_region = payload.region(match) or region
    run.quota.see(payload.patch(match))
    if not run.quota.accepts(payload.patch(match), map_name, match_region):
        return 0
    match_repository.save(session, match, MatchSource.TOP)
    session.commit()
    run.quota.add(map_name, match_region)
    return 1


def _started_utc(match: dict[str, Any]) -> datetime:
    return datetime.fromisoformat(match["metadata"]["started_at"].replace("Z", "+00:00"))
