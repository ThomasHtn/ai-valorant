"""Squad collection: members and 5-stacks from ValoQuests, details from Henrik."""

import logging

from sqlalchemy.orm import Session

from valostats.analysis.extraction.henrik_payload import match_id
from valostats.clients.henrik_client import HenrikClient
from valostats.clients.valoquests_client import ValoQuestsClient
from valostats.clients.valorant_api_client import fetch_maps
from valostats.constants.game import TEAM_SIZE
from valostats.constants.henrik import SQUAD_HISTORY_SIZE, SQUAD_REGION
from valostats.domain.enums import MatchSource
from valostats.ingestion.facts_rebuild import rebuild_facts
from valostats.repositories import facts_repository, map_repository, match_repository, squad_repository

logger = logging.getLogger(__name__)


def sync_squad(session: Session, valoquests: ValoQuestsClient, henrik: HenrikClient) -> None:
    """Collect, then rebuild the facts only when something changed: a new match or a new roster."""
    roster = squad_repository.active_puuids(session)
    squad_repository.replace_all(session, valoquests.squad())
    # Maps are fetched once; `sync-maps` refreshes them after a new map release.
    if not map_repository.load_all(session):
        map_repository.replace_all(session, fetch_maps())
    session.commit()

    listed = valoquests.squad_match_ids()
    known = match_repository.known_ids(session, listed)
    missing = [i for i in listed if i not in known]
    logger.info("%d match(es) to download", len(missing))
    downloaded = 0
    for n, mid in enumerate(missing, 1):
        match = henrik.match(mid)
        if match:
            downloaded += match_repository.save(session, match, MatchSource.SQUAD)
            session.commit()
            logger.info("%d/%d %s", n, len(missing), mid)

    added = _sync_recent_history(session, henrik)
    logger.info("%d new 5-stack(s) found in the players' Henrik history", added)
    never_built = facts_repository.latest_build(session, MatchSource.SQUAD) is None
    if not (downloaded or added or never_built or squad_repository.active_puuids(session) != roster):
        logger.info("nothing new: facts and report views kept")
        return
    rebuild_facts(session, MatchSource.SQUAD)


def _sync_recent_history(session: Session, henrik: HenrikClient) -> int:
    """Recent matches of each player straight from Henrik, keeping new 5-stacks (ValoQuests may lag or be down)."""
    squad = squad_repository.active_puuids(session)
    added = 0
    for puuid in squad:
        for match in henrik.competitive_history(puuid, SQUAD_REGION, SQUAD_HISTORY_SIZE):
            teams = [p["team_id"] for p in match["players"] if p["puuid"] in squad]
            is_stack = bool(teams) and max(teams.count(t) for t in set(teams)) >= TEAM_SIZE
            if is_stack and match_repository.save(session, match, MatchSource.SQUAD):
                session.commit()
                added += 1
                logger.info("new 5-stack %s", match_id(match))
    return added
