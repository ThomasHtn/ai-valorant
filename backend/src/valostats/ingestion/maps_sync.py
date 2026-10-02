"""Map metadata refresh, needed after a new map is released."""

import logging

from sqlalchemy.orm import Session

from valostats.clients.valorant_api_client import fetch_maps
from valostats.domain.enums import MatchSource
from valostats.ingestion.facts_rebuild import rebuild_facts
from valostats.repositories import map_repository

logger = logging.getLogger(__name__)


def sync_maps(session: Session) -> None:
    """Replace the maps, then rebuild the facts: callouts may have moved and new maps become analysable."""
    maps = fetch_maps()
    map_repository.replace_all(session, maps)
    session.commit()
    logger.info("%d maps stored", len(maps))
    rebuild_facts(session, MatchSource.SQUAD)
    rebuild_facts(session, MatchSource.TOP)
