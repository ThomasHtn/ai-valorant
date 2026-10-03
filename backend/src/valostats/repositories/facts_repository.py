"""Read and replace the fact tables."""

from collections.abc import Callable, Iterable
from typing import Any

from sqlalchemy import Table, delete, insert, select
from sqlalchemy.orm import Session

from valostats.db.models import (
    FactsBuild,
    KillFactRow,
    MatchFactRow,
    PlayerMatchFactRow,
    PlayerRoundFactRow,
    RoundFactRow,
    WinProbabilityRow,
)
from valostats.domain.enums import Cohort, MatchSource, Side
from valostats.domain.facts import KillFact, MatchFact, PlayerMatchFact, PlayerRoundFact, RoundFact, SourceFacts, WinProbabilityCell
from valostats.repositories import fact_mappers as mappers

# Cohorts produced by each match source.
SOURCE_COHORTS = {MatchSource.SQUAD: (Cohort.SQUAD, Cohort.OPPONENT), MatchSource.TOP: (Cohort.TOP,)}
INSERT_BATCH = 5000


def replace_source_facts(session: Session, source: MatchSource, facts: SourceFacts, match_count: int) -> None:
    """Swap every fact of a source in one transaction, then record the build."""
    cohorts = [c.value for c in SOURCE_COHORTS[source]]
    _replace_rows(session, MatchFactRow, cohorts, [mappers.match_to_row(f) for f in facts.matches])
    _replace_rows(session, RoundFactRow, cohorts, [mappers.round_to_row(f) for f in facts.rounds])
    _replace_rows(session, KillFactRow, cohorts, [mappers.kill_to_row(f) for f in facts.kills])
    _replace_rows(session, PlayerRoundFactRow, cohorts, [mappers.player_round_to_row(f) for f in facts.player_rounds])
    _replace_rows(session, PlayerMatchFactRow, cohorts, [mappers.player_match_to_row(f) for f in facts.player_matches])
    session.execute(delete(WinProbabilityRow).where(WinProbabilityRow.source == source.value))
    session.add_all(
        WinProbabilityRow(
            source=source.value,
            own_alive=c.own_alive,
            opp_alive=c.opp_alive,
            side=c.side.value,
            planted=c.planted,
            wins=c.wins,
            total=c.total,
        )
        for c in facts.win_probability
    )
    session.add(FactsBuild(source=source.value, matches=match_count))
    session.commit()


def _replace_rows(session: Session, model: Any, cohorts: list[str], rows: list[dict[str, Any]]) -> None:
    table: Table = model.__table__
    session.execute(delete(table).where(table.c.cohort.in_(cohorts)))
    for start in range(0, len(rows), INSERT_BATCH):
        session.execute(insert(table), rows[start : start + INSERT_BATCH])


def _load[T](session: Session, model: Any, cohorts: Iterable[Cohort], from_row: Callable[[Any], T]) -> list[T]:
    table: Table = model.__table__
    columns = [c for c in table.c if c.name != "id"]
    query = select(*columns).where(table.c.cohort.in_([c.value for c in cohorts])).order_by(table.c.started_at, table.c.id)
    return [from_row(row) for row in session.execute(query).mappings()]


def load_rounds(session: Session, cohorts: Iterable[Cohort]) -> list[RoundFact]:
    return _load(session, RoundFactRow, cohorts, mappers.round_from_row)


def load_matches(session: Session, cohorts: Iterable[Cohort]) -> list[MatchFact]:
    return _load(session, MatchFactRow, cohorts, mappers.match_from_row)


def load_kills(session: Session, cohorts: Iterable[Cohort]) -> list[KillFact]:
    """Kills whose victim belongs to one of the cohorts (every kill of their matches for squad + opp)."""
    return _load(session, KillFactRow, cohorts, mappers.kill_from_row)


def load_player_rounds(session: Session, cohorts: Iterable[Cohort]) -> list[PlayerRoundFact]:
    return _load(session, PlayerRoundFactRow, cohorts, mappers.player_round_from_row)


def load_player_matches(session: Session, cohorts: Iterable[Cohort]) -> list[PlayerMatchFact]:
    return _load(session, PlayerMatchFactRow, cohorts, mappers.player_match_from_row)


def load_win_probability(session: Session, source: MatchSource) -> list[WinProbabilityCell]:
    rows = session.scalars(select(WinProbabilityRow).where(WinProbabilityRow.source == source.value))
    return [WinProbabilityCell(r.own_alive, r.opp_alive, Side(r.side), r.planted, r.wins, r.total) for r in rows]


def latest_build(session: Session, source: MatchSource) -> FactsBuild | None:
    """Last rebuild of a source; its id versions the API caches."""
    query = select(FactsBuild).where(FactsBuild.source == source.value).order_by(FactsBuild.id.desc()).limit(1)
    return session.scalar(query)
