"""One-off import of the JSON files written by the legacy scripts (`data/`)."""

import csv
import gzip
import json
import logging
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from valostats.clients.valorant_api_client import parse_maps
from valostats.constants.game import LOCAL_TIMEZONE
from valostats.domain.enums import MatchSource
from valostats.ingestion.facts_rebuild import rebuild_facts
from valostats.repositories import leaderboard_repository, map_repository, match_repository, squad_repository

logger = logging.getLogger(__name__)


def import_legacy(session: Session, data_dir: Path) -> None:
    """Squad, maps, squad matches, top ranked matches and leaderboards; already known matches are skipped."""
    with open(data_dir / "squad.csv") as f:
        squad_repository.replace_all(session, ((row[0], row[1]) for row in csv.reader(f)))
    map_repository.replace_all(session, parse_maps(json.loads((data_dir / "maps.json").read_text())))
    session.commit()

    squad_new = sum(match_repository.save(session, json.loads(p.read_text()), MatchSource.SQUAD) for p in (data_dir / "raw").glob("*.json"))
    session.commit()
    logger.info("%d squad matches imported", squad_new)

    top_new = 0
    for path in (data_dir / "top" / "raw").glob("*.json.gz"):
        with gzip.open(path, "rt") as f:
            top_new += match_repository.save(session, json.load(f), MatchSource.TOP)
    session.commit()
    logger.info("%d top ranked matches imported", top_new)

    # File names are '<YYYY-MM-DD>_<region>.json'.
    for path in sorted((data_dir / "top" / "leaderboards").glob("*.json")):
        day, region = path.stem.split("_")
        taken_at = datetime.fromisoformat(day).replace(tzinfo=ZoneInfo(LOCAL_TIMEZONE))
        leaderboard_repository.add_snapshot(session, region, taken_at, json.loads(path.read_text()))
    session.commit()

    rebuild_facts(session, MatchSource.SQUAD)
    rebuild_facts(session, MatchSource.TOP)
