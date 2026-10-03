"""Match-level views: the detail of one match and the sheet of one round, whatever the period.

Period-level views (match list, rounds list, minimap) go through `ReportService.view`, which caches
them per period; this service adds what is addressed by a match id, cached in small LRUs.
"""

import threading
from collections import OrderedDict
from collections.abc import Callable
from datetime import date

from sqlalchemy.orm import Session, sessionmaker

from valostats.analysis.extraction.win_probability import WinProbabilityTable
from valostats.analysis.report.rounds.matches import MatchRecords, index_matches, match_detail
from valostats.analysis.report.rounds.round_lines import evening_days, round_lines
from valostats.analysis.report.rounds.round_sheet import round_sheet
from valostats.analysis.report.rounds.round_states import RoundKey, kills_by_round
from valostats.constants.rounds import CACHED_MATCH_DETAILS, CACHED_ROUND_SHEETS
from valostats.core.errors import NotFoundError
from valostats.domain.enums import Cohort, KillerCohort
from valostats.domain.facts import KillFact
from valostats.domain.maps import GameMap
from valostats.repositories import match_repository
from valostats.schemas.report.matches import MatchDetail
from valostats.schemas.report.rounds import RoundSheet
from valostats.services.facts_store import FactsStore


class _SquadIndex:
    """Squad facts grouped by match, rebuilt once per facts version."""

    def __init__(self, version: int, records: dict[str, MatchRecords], kills: dict[RoundKey, list[KillFact]], days: dict[str, date]):
        self.version = version
        self.records = records
        self.kills = kills
        self.days = days


class _Lru[K, V]:
    """A tiny least-recently-used cache."""

    def __init__(self, size: int) -> None:
        self._size = size
        self._items: OrderedDict[K, V] = OrderedDict()

    def get_or_compute(self, key: K, compute: Callable[[], V]) -> V:
        if key not in self._items:
            self._items[key] = compute()
            if len(self._items) > self._size:
                self._items.popitem(last=False)
        self._items.move_to_end(key)
        return self._items[key]


class MatchService:
    def __init__(self, store: FactsStore, session_factory: sessionmaker[Session]) -> None:
        self._store = store
        self._session_factory = session_factory
        self._lock = threading.RLock()
        self._index: _SquadIndex | None = None
        self._details: _Lru[tuple[int, str], MatchDetail] = _Lru(CACHED_MATCH_DETAILS)
        self._sheets: _Lru[tuple[int, int, str, int], RoundSheet] = _Lru(CACHED_ROUND_SHEETS)

    def maps(self) -> dict[str, GameMap]:
        return self._store.maps()

    def win_probability(self) -> WinProbabilityTable:
        """Chances of winning a round by situation, measured on top ranked games."""
        return self._store.top().win_probability

    def detail(self, match_id: str) -> MatchDetail:
        index = self._squad_index()
        record = self._record(index, match_id)
        with self._lock:
            return self._details.get_or_compute((index.version, match_id), lambda: match_detail(record, index.days[match_id]))

    def sheet(self, match_id: str, round_number: int) -> RoundSheet:
        index = self._squad_index()
        record = self._record(index, match_id)
        if not any(r.round_index == round_number - 1 for r in record.rounds):
            raise NotFoundError(f"No round {round_number} in match {match_id}.")
        top_version = self._store.top().version
        with self._lock:
            return self._sheets.get_or_compute(
                (index.version, top_version, match_id, round_number), lambda: self._build_sheet(index, record, round_number)
            )

    def _build_sheet(self, index: _SquadIndex, record: MatchRecords, round_number: int) -> RoundSheet:
        table = self.win_probability()
        lines = round_lines(record.rounds, index.kills, table, index.days)
        line = next(line for line in lines if line.round_number == round_number)
        game_map = self.maps().get(record.squad.map_name)
        if game_map is None:
            raise NotFoundError(f"No minimap data for {record.squad.map_name}.")
        with self._session_factory() as session:
            payloads = match_repository.load_payloads_by_ids(session, [record.squad.match_id])
        if not payloads:
            raise NotFoundError(f"Raw match {record.squad.match_id} is missing.")
        return round_sheet(payloads[0], line, record.squad.team_id, game_map, table)

    def _record(self, index: _SquadIndex, match_id: str) -> MatchRecords:
        record = index.records.get(match_id)
        if record is None:
            raise NotFoundError(f"No squad match {match_id}.")
        return record

    def _squad_index(self) -> _SquadIndex:
        squad = self._store.squad()
        with self._lock:
            if self._index is None or self._index.version != squad.version:
                records = index_matches(squad.matches, squad.rounds, squad.player_rounds, squad.player_matches)
                # Same kills as the period rounds list: no teamkill, no environment kill.
                kills = kills_by_round(k for k in squad.kills if not k.teamkill and k.killer_cohort is not KillerCohort.ENVIRONMENT)
                days = evening_days(m for m in squad.matches if m.cohort is Cohort.SQUAD)
                self._index = _SquadIndex(squad.version, records, kills, days)
            return self._index
