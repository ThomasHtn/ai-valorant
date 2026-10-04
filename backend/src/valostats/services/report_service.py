"""Report service: serves each view of a period as JSON, computed once per data version and stored.

A view is read from the `report_snapshot` table first. On a miss (new facts, new code, a period nobody
asked for yet) it is computed from the period's cohorts, kept in memory, then stored so later requests
and restarts read it as is. `services/snapshot_refresh.py` fills the table after each collection.
"""

import threading
from collections import OrderedDict
from collections.abc import Callable, Sequence
from dataclasses import dataclass, field
from typing import Any

from pydantic_core import to_json

from valostats.analysis.report.domains import build_domain
from valostats.analysis.report.foundation.cohorts import FactIndex, FactKind, ReportCohorts, build_cohorts, build_index
from valostats.analysis.report.foundation.period_selection import PeriodQuery, resolve
from valostats.analysis.report.insights.detections import detections
from valostats.analysis.report.insights.distributions import DistributionScope, distributions
from valostats.analysis.report.insights.findings import findings_report
from valostats.analysis.report.insights.trends import trends
from valostats.analysis.report.overview.meta import report_meta, report_periods
from valostats.analysis.report.players.player_sheet import player_sheet, player_summaries
from valostats.analysis.report.rounds.matches import match_list
from valostats.analysis.report.rounds.minimap import minimap_view
from valostats.analysis.report.rounds.round_lines import evening_days, rounds_index
from valostats.constants.report import CACHED_PERIODS
from valostats.core.code_version import code_version
from valostats.core.errors import NotFoundError
from valostats.domain.enums import Cohort
from valostats.repositories.snapshot_repository import DataVersion, SnapshotKey
from valostats.services.facts_store import FactsStore
from valostats.services.snapshot_store import SnapshotStore

# Stored key of the home tree, which belongs to no period.
HOME_PERIOD = "*"
HOME_VIEW = "periods"


@dataclass
class _PeriodEntry:
    """Cohorts of a period, the data version they come from, and the views already serialized."""

    cohorts: ReportCohorts
    version: DataVersion
    views: dict[str, str] = field(default_factory=dict)


class ReportService:
    def __init__(self, store: FactsStore, snapshots: SnapshotStore | None = None) -> None:
        self._store = store
        # None keeps views in memory only (tests).
        self._snapshots = snapshots
        self._periods: OrderedDict[tuple[str, int, int], _PeriodEntry] = OrderedDict()
        self._top_index: tuple[int, FactIndex] | None = None
        # Requests run in a thread pool: a period is computed once, not once per concurrent request.
        self._lock = threading.RLock()

    def version(self) -> DataVersion:
        squad, top = self._store.versions()
        return DataVersion(squad=squad, top=top, code=code_version())

    def periods(self) -> str:
        """The home tree, stored like the views: reading it never waits for the facts to load."""
        if self._snapshots is not None:
            stored = self._snapshots.find(SnapshotKey(HOME_PERIOD, HOME_VIEW, self.version()))
            if stored is not None:
                return stored
        squad, top = self._store.squad(), self._store.top()
        payload = to_json(report_periods(squad.matches, top.matches, top.match_count), by_alias=True).decode()
        if self._snapshots is not None:
            version = DataVersion(squad=squad.version, top=top.version, code=code_version())
            self._snapshots.save(SnapshotKey(HOME_PERIOD, HOME_VIEW, version), payload)
        return payload

    # --- Views of a period, each one a JSON body ---

    def meta(self, query: PeriodQuery) -> str:
        return self.view(query, "meta", lambda c: report_meta(query, c, self._store.top().match_count))

    def tables(self, query: PeriodQuery, domain: str) -> str:
        return self.view(query, f"tables:{domain}", lambda c: build_domain(domain, c))

    def findings(self, query: PeriodQuery) -> str:
        return self.view(query, "findings", findings_report)

    def detections(self, query: PeriodQuery) -> str:
        return self.view(query, "detections", detections)

    def trends(self, query: PeriodQuery) -> str:
        # Trends read the squad's whole history, beyond the period's cohorts.
        return self.view(query, "trends", lambda c: trends(c, self._store.squad()))

    def distributions(self, query: PeriodQuery, scope: DistributionScope) -> str:
        # The map is part of the stored key: an unchecked name would store one view per value sent.
        if scope.map_name is not None and scope.map_name not in self._store.maps():
            raise NotFoundError(f"Unknown map {scope.map_name}.")
        return self.view(query, scope.cache_key, lambda c: distributions(c, scope))

    def matches(self, query: PeriodQuery) -> str:
        return self.view(query, "matches", match_list)

    def rounds(self, query: PeriodQuery) -> str:
        return self.view(query, "rounds", lambda c: rounds_index(c, self._store.top().win_probability))

    def minimap(self, query: PeriodQuery, map_name: str) -> str:
        game_map = self._store.maps().get(map_name)
        if game_map is None:
            raise NotFoundError(f"Unknown map {map_name}.")
        return self.view(query, f"minimap:{map_name}", lambda c: minimap_view(c, game_map))

    def players(self, query: PeriodQuery) -> str:
        return self.view(query, "players", player_summaries)

    def player(self, query: PeriodQuery, name: str) -> str:
        return self.view(query, f"player:{name}", lambda c: player_sheet(c, name))

    def view(self, query: PeriodQuery, name: str, compute: Callable[[ReportCohorts], Any]) -> str:
        """A view of the period: stored JSON when present, else computed, kept in memory and stored."""
        if self._snapshots is not None:
            stored = self._snapshots.find(SnapshotKey(query.key, name, self.version()))
            if stored is not None:
                return stored
        entry = self._entry(query)
        with self._lock:
            payload = entry.views.get(name)
            if payload is None:
                payload = to_json(compute(entry.cohorts), by_alias=True).decode()
                entry.views[name] = payload
        if self._snapshots is not None:
            # Stored under the version the cohorts were built from, even if a rebuild landed meanwhile.
            self._snapshots.save(SnapshotKey(query.key, name, entry.version), payload)
        return payload

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
                session_day = evening_days(m for m in squad.matches if m.cohort is Cohort.SQUAD)
                window = resolve(query, [r.started_at for r in squad_rounds], [r.patch for r in squad_rounds], session_day)
                if not any(window.includes(m) for m in squad.matches if m.cohort is Cohort.SQUAD):
                    raise NotFoundError(f"No squad match in period {window.title}.")
                facts: dict[FactKind, Sequence[Any]] = {
                    FactKind.MATCHES: squad.matches,
                    FactKind.ROUNDS: squad.rounds,
                    FactKind.KILLS: squad.kills,
                    FactKind.PLAYER_ROUNDS: squad.player_rounds,
                    FactKind.PLAYER_MATCHES: squad.player_matches,
                }
                cohorts = build_cohorts(window, facts, self._top(top.version), squad.portraits)
                version = DataVersion(squad=squad.version, top=top.version, code=code_version())
                self._periods[key] = _PeriodEntry(cohorts, version)
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
