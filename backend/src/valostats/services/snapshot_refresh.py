"""Precompute the report views of every period listed on the home page, after each collection.

Facts are rebuilt as a whole (see `ingestion/facts_rebuild.py`), so a new build changes every period:
each view is computed once for the new data version, then older versions are dropped. Views already
stored for the current version are skipped, so running this again (scheduler restart) costs nothing.
Views nobody precomputes (custom ranges, distributions by map) are computed on the first request.
"""

import logging
import time

from sqlalchemy.orm import Session, sessionmaker

from valostats.analysis.report.domains import DOMAINS
from valostats.analysis.report.foundation.period_selection import PeriodQuery
from valostats.analysis.report.insights.distributions import DistributionScope
from valostats.core.errors import NotFoundError
from valostats.repositories.snapshot_repository import SnapshotKey
from valostats.schemas.report.meta import ReportPeriods
from valostats.services.facts_store import FactsStore
from valostats.services.report_service import ReportService
from valostats.services.snapshot_store import SnapshotStore

logger = logging.getLogger(__name__)

# Marker row written once every period of a data version is stored.
COMPLETE_PERIOD = "*"
COMPLETE_VIEW = "complete"


def refresh_snapshots(session_factory: sessionmaker[Session]) -> None:
    snapshots = SnapshotStore(session_factory)
    reports = ReportService(FactsStore(session_factory), snapshots)
    version = reports.version()
    marker = SnapshotKey(COMPLETE_PERIOD, COMPLETE_VIEW, version)
    if snapshots.exists(marker):
        logger.info("report views already stored for this data version")
        return
    started = time.monotonic()
    queries = home_periods(ReportPeriods.model_validate_json(reports.periods()))
    for n, query in enumerate(queries, 1):
        _store_period(reports, query)
        logger.info("%d/%d %s stored", n, len(queries), query.key)
    snapshots.save(marker, "{}")
    deleted = snapshots.delete_other_versions(version)
    logger.info("report views stored in %.0f s, %d old view(s) deleted", time.monotonic() - started, deleted)


def home_periods(periods: ReportPeriods) -> list[PeriodQuery]:
    """Every period the home page and the period selector open, the most read first."""
    queries = [PeriodQuery()]
    queries += [PeriodQuery(month=m.key) for m in periods.months]
    queries += [PeriodQuery(start=s.day, end=s.day) for m in periods.months for s in m.sessions]
    queries += [PeriodQuery(patch=p) for p in periods.patches]
    if periods.first_day and periods.last_day:
        queries.append(PeriodQuery(start=periods.first_day, end=periods.last_day))
    return queries


def _store_period(reports: ReportService, query: PeriodQuery) -> None:
    """The views each report page loads by default."""
    try:
        cohorts = reports.cohorts(query)
    except NotFoundError:
        # A patch or month without squad match of its own: nothing to show.
        return
    reports.meta(query)
    reports.squad(query)
    for domain in DOMAINS:
        reports.tables(query, domain)
    reports.findings(query)
    reports.detections(query)
    reports.trends(query)
    reports.distributions(query, DistributionScope())
    reports.matches(query)
    reports.rounds(query)
    reports.players(query)
    for player in cohorts.players():
        reports.player(query, player.name)
    for map_name in cohorts.maps():
        try:
            reports.minimap(query, map_name)
        except NotFoundError:
            # A map without minimap metadata (sync-maps not run since its release).
            continue
    # Stratégie opens on any map of the pool, played or not.
    for map_name in sorted(cohorts.pool) or cohorts.maps():
        try:
            reports.strategy(query, map_name)
        except NotFoundError:
            continue
