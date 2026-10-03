"""In-memory facts, loaded once from the database and reloaded after each rebuild.

Every report reads the whole history (the squad's habits, the top ranked references), so facts are
kept in memory rather than queried per request. Loading the top ranked facts takes a few seconds,
which is why the application warms this store at startup.
"""

import threading
from dataclasses import dataclass

from sqlalchemy.orm import Session, sessionmaker

from valostats.analysis.extraction.win_probability import WinProbabilityTable
from valostats.domain.enums import Cohort, MatchSource
from valostats.domain.facts import KillFact, MatchFact, PlayerMatchFact, PlayerRoundFact, RoundFact
from valostats.domain.maps import GameMap
from valostats.repositories import facts_repository, map_repository, squad_repository


@dataclass(frozen=True)
class SquadFacts:
    """Facts of the squad's 5-stacks, both teams (squad and opponents), teamkills included."""

    # Id of the facts build: changes after each rebuild, so caches keyed on it expire.
    version: int
    matches: list[MatchFact]
    rounds: list[RoundFact]
    kills: list[KillFact]
    player_rounds: list[PlayerRoundFact]
    player_matches: list[PlayerMatchFact]
    # Puuids of the active squad players.
    squad: set[str]
    # Puuid -> avatar agent picked in ValoQuests.
    portraits: dict[str, str]
    win_probability: WinProbabilityTable


@dataclass(frozen=True)
class TopFacts:
    """Facts of the top ranked matches, the reference of the game sections."""

    version: int
    # Matches collected (each one gives two teams of facts).
    match_count: int
    matches: list[MatchFact]
    rounds: list[RoundFact]
    kills: list[KillFact]
    player_rounds: list[PlayerRoundFact]
    player_matches: list[PlayerMatchFact]
    win_probability: WinProbabilityTable


class FactsStore:
    def __init__(self, session_factory: sessionmaker[Session]) -> None:
        self._session_factory = session_factory
        self._lock = threading.Lock()
        self._squad: SquadFacts | None = None
        self._top: TopFacts | None = None
        self._maps: dict[str, GameMap] | None = None

    def squad(self) -> SquadFacts:
        with self._session_factory() as session:
            version = _version(session, MatchSource.SQUAD)
            with self._lock:
                if self._squad is None or self._squad.version != version:
                    self._squad = _load_squad(session, version)
                    # A rebuild may follow a map refresh (sync-maps).
                    self._maps = None
                return self._squad

    def top(self) -> TopFacts:
        with self._session_factory() as session:
            version = _version(session, MatchSource.TOP)
            with self._lock:
                if self._top is None or self._top.version != version:
                    self._top = _load_top(session, version)
                    self._maps = None
                return self._top

    def maps(self) -> dict[str, GameMap]:
        with self._lock:
            if self._maps is None:
                with self._session_factory() as session:
                    self._maps = map_repository.load_all(session)
            return self._maps


def _version(session: Session, source: MatchSource) -> int:
    build = facts_repository.latest_build(session, source)
    return build.id if build else 0


def _load_squad(session: Session, version: int) -> SquadFacts:
    cohorts = (Cohort.SQUAD, Cohort.OPPONENT)
    return SquadFacts(
        version=version,
        matches=facts_repository.load_matches(session, cohorts),
        rounds=facts_repository.load_rounds(session, cohorts),
        kills=facts_repository.load_kills(session, cohorts),
        player_rounds=facts_repository.load_player_rounds(session, cohorts),
        player_matches=facts_repository.load_player_matches(session, cohorts),
        squad=squad_repository.active_puuids(session),
        portraits=squad_repository.portraits(session),
        win_probability=WinProbabilityTable(facts_repository.load_win_probability(session, MatchSource.SQUAD)),
    )


def _load_top(session: Session, version: int) -> TopFacts:
    build = facts_repository.latest_build(session, MatchSource.TOP)
    cohorts = (Cohort.TOP,)
    return TopFacts(
        version=version,
        match_count=build.matches if build else 0,
        matches=facts_repository.load_matches(session, cohorts),
        rounds=facts_repository.load_rounds(session, cohorts),
        kills=facts_repository.load_kills(session, cohorts),
        player_rounds=facts_repository.load_player_rounds(session, cohorts),
        player_matches=facts_repository.load_player_matches(session, cohorts),
        win_probability=WinProbabilityTable(facts_repository.load_win_probability(session, MatchSource.TOP)),
    )
