"""Production scheduler: the squad and top ranked collections every night."""

import logging
import time
from collections.abc import Callable, Sequence
from datetime import UTC, datetime, timedelta

from valostats.constants.schedule import COLLECTION_HOUR_UTC

logger = logging.getLogger(__name__)


def next_run(now: datetime) -> datetime:
    """Next collection time strictly after `now`."""
    run = now.replace(hour=COLLECTION_HOUR_UTC, minute=0, second=0, microsecond=0)
    return run if run > now else run + timedelta(days=1)


def run_forever(startup: Callable[[], None], nightly: Sequence[Callable[[], None]]) -> None:
    _run_safely(startup)
    while True:
        now = datetime.now(UTC)
        run = next_run(now)
        logger.info("next collection at %s", run.isoformat())
        time.sleep((run - now).total_seconds())
        # Each job runs even if the previous one failed.
        for job in nightly:
            _run_safely(job)


def _run_safely(job: Callable[[], None]) -> None:
    # A failed job (Henrik down, ValoQuests unreachable) must not stop the next nights.
    try:
        job()
    except Exception:
        logger.exception("collection failed; retried at the next run")
