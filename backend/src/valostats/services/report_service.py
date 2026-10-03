"""Report service: turns a period query into indexed cohorts (cached) and serves the report views.

Views of wave 2 (findings, minimap, rounds...) reuse `cohorts(query)`, which is computed once per
period and per facts version, then kept in a small LRU cache.
"""

import threading
from collections import OrderedDict
from collections.abc import Callable, Sequence
from dataclasses import dataclass, field
from typing import Any

from valostats.analysis.report.domains import build_domain
from valostats.analysis.report.foundation.cohorts import FactIndex, FactKind, ReportCohorts, build_cohorts, build_index
from valostats.analysis.report.foundation.period_selection import PeriodQuery, resolve
from valostats.analysis.report.overview.meta import report_meta, report_periods
from valostats.constants.report import CACHED_PERIODS
from valostats.core.errors import NotFoundError
from valostats.domain.enums import Cohort
from valostats.schemas.report.meta import ReportMeta, ReportPeriods
from valostats.schemas.report.tables import DomainTables
from valostats.services.facts_store import FactsStore


@dataclass
class _PeriodEntry:
    """Cohorts of a period and every view already computed on them."""

    cohorts: ReportCohorts
    views: dict[str, Any] = field(default_factory=dict)


class ReportService:
    def __init__(self, store: FactsStore) -> None:
        self._store = store
        self._periods: OrderedDict[tuple[str, int, int], _PeriodEntry] = OrderedDict()
        self._top_index: tuple[int, FactIndex] | None = None
        # Requests run in a thread pool: a period is computed once, not once per concurrent request.
        self._lock = threading.RLock()

    def periods(self) -> ReportPeriods:
        squad, top = self._store.squad(), self._store.top()
        return report_periods(squad.matches, top.matches, top.match_count)

    def meta(self, query: PeriodQuery) -> ReportMeta:
        return self.view(query, "meta", lambda c: report_meta(query, c, self._store.top().match_count))

    def tables(self, query: PeriodQuery, domain: str) -> DomainTables:
        return self.view(query, f"tables:{domain}", lambda c: build_domain(domain, c))

    def view[T](self, query: PeriodQuery, name: str, compute: Callable[[ReportCohorts], T]) -> T:
        """A view of the period, computed once per period and facts version, then served from memory."""
        entry = self._entry(query)
        with self._lock:
            if name not in entry.views:
                entry.views[name] = compute(entry.cohorts)
            return entry.views[name]  # type: ignore[no-any-return]

    def cohorts(self, query: PeriodQuery) -> ReportCohorts:
        return self._entry(query).cohorts

    def _entry(self, query: PeriodQuery) -> _PeriodEntry:
        squad, top = self._store.squad(), self._store.top()
        key = (query.key, squad.version, top.version)
        with self._lock:
            if key not in self._periods:
                squad_rounds = [r for r in squad.rounds if r.cohort is Cohort.SQUAD]
                if not squad_rounds:
                    raise NotFoundError("No squad match in the database.")
                window = resolve(query, [r.started_at for r in squad_rounds], [r.patch for r in squad_rounds])
                if not any(window.includes(m) for m in squad.matches if m.cohort is Cohort.SQUAD):
                    raise NotFoundError(f"No squad match in period {window.title}.")
                facts: dict[FactKind, Sequence[Any]] = {
                    FactKind.MATCHES: squad.matches,
                    FactKind.ROUNDS: squad.rounds,
                    FactKind.KILLS: squad.kills,
                    FactKind.PLAYER_ROUNDS: squad.player_rounds,
                    FactKind.PLAYER_MATCHES: squad.player_matches,
                }
                self._periods[key] = _PeriodEntry(build_cohorts(window, facts, self._top(top.version), squad.portraits))
                if len(self._periods) > CACHED_PERIODS:
                    self._periods.popitem(last=False)
            self._periods.move_to_end(key)
            return self._periods[key]

    def _top(self, version: int) -> FactIndex:
        """Index of the top ranked facts, shared by every period and rebuilt only after a new collection."""
        if self._top_index is None or self._top_index[0] != version:
            top = self._store.top()
            self._top_index = (
                version,
                build_index(top.matches, top.rounds, top.kills, top.player_rounds, top.player_matches, Cohort.TOP),
            )
        return self._top_index[1]
