"""Rebuild every fact of a source from the stored raw matches.

The whole source is rebuilt, not only new matches: the impact of a kill depends on the win
probability table, which itself depends on every match of the source.
"""

import logging

from sqlalchemy.orm import Session

from valostats.analysis.extraction.player_facts import extract_players
from valostats.analysis.extraction.round_facts import extract_rounds
from valostats.analysis.extraction.win_probability import WinProbabilityTable
from valostats.domain.enums import MatchSource
from valostats.repositories import facts_repository, map_repository, match_repository, squad_repository

logger = logging.getLogger(__name__)


def rebuild_facts(session: Session, source: MatchSource) -> None:
    matches = match_repository.load_payloads(session, source)
    maps = map_repository.load_all(session)
    squad = squad_repository.active_puuids(session) if source is MatchSource.SQUAD else None
    rounds = extract_rounds(matches, maps, squad)
    table = WinProbabilityTable.from_matches(matches)
    players = extract_players(matches, maps, table, squad)
    facts_repository.replace_source_facts(
        session, source, rounds.rounds, rounds.deaths, players.rounds, players.matches, table.cells(), len(matches)
    )
    logger.info("%s facts rebuilt: %d matches, %d team rounds", source.value, len(matches), len(rounds.rounds))
