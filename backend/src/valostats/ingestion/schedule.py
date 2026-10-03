"""Production scheduler: the squad sync every night, the top ranked sync once a week."""

import logging
import time
from collections.abc import Callable
from datetime import UTC, datetime, timedelta

from valostats.constants.schedule import COLLECTION_HOUR_UTC, TOP_COLLECTION_WEEKDAY

logger = logging.getLogger(__name__)


def next_run(now: datetime) -> datetime:
    """Next collection time strictly after `now`."""
    run = now.replace(hour=COLLECTION_HOUR_UTC, minute=0, second=0, microsecond=0)
    return run if run > now else run + timedelta(days=1)


def run_forever(nightly: Callable[[], None], weekly: Callable[[], None]) -> None:
    while True:
        now = datetime.now(UTC)
        run = next_run(now)
        logger.info("next collection at %s", run.isoformat())
        time.sleep((run - now).total_seconds())
        _run_safely(nightly)
        if run.weekday() == TOP_COLLECTION_WEEKDAY:
            _run_safely(weekly)


def _run_safely(job: Callable[[], None]) -> None:
    # A failed job (Henrik down, ValoQuests unreachable) must not stop the next nights.
    try:
        job()
    except Exception:
        logger.exception("collection failed; retried at the next run")
