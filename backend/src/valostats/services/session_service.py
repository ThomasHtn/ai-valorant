"""Session reports: the squad's evenings."""

from datetime import date

from sqlalchemy.orm import Session, sessionmaker

from valostats.analysis.session.grouping import sessions
from valostats.analysis.session.report import session_report
from valostats.core.errors import NotFoundError
from valostats.repositories import match_repository
from valostats.schemas.session import SessionListItem, SessionReport
from valostats.services.facts_store import FactsStore


class SessionService:
    def __init__(self, store: FactsStore, session_factory: sessionmaker[Session]) -> None:
        self._store = store
        self._session_factory = session_factory

    def list(self) -> list[SessionListItem]:
        """Newest evening first."""
        return [
            SessionListItem(
                day=s.day,
                matches=len(s.matches),
                wins=sum(m.won for m in s.matches),
                losses=sum(not m.won for m in s.matches),
                maps=[m.map_name for m in s.matches],
            )
            for s in reversed(sessions(self._store.squad().rounds))
        ]

    def report(self, day: date | None) -> SessionReport:
        """The evening starting on `day`, or the latest one."""
        facts = self._store.squad()
        evenings = sessions(facts.rounds)
        if not evenings:
            raise NotFoundError("No squad 5-stack in the database.")
        chosen = evenings[-1] if day is None else next((s for s in evenings if s.day == day), None)
        if chosen is None:
            raise NotFoundError(f"No session starting on {day}.")
        # Raw payloads are only needed for the round timelines of this evening's matches.
        with self._session_factory() as session:
            payloads = match_repository.load_payloads_by_ids(session, chosen.match_ids)
        return session_report(
            chosen, payloads, facts.squad, facts.rounds, facts.deaths, facts.player_rounds, facts.win_probability, self._store.maps()
        )
