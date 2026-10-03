"""Rebuild every fact of a source from the stored raw matches.

The whole source is rebuilt, not only new matches: the impact of a kill depends on the win
probability table, which itself depends on every match of the source.
"""

import logging

from sqlalchemy.orm import Session

from valostats.analysis.extraction.context import matches_to_extract
from valostats.analysis.extraction.kill_facts import extract_kills
from valostats.analysis.extraction.match_facts import extract_matches
from valostats.analysis.extraction.player_facts import extract_players
from valostats.analysis.extraction.round_facts import extract_rounds
from valostats.analysis.extraction.win_probability import WinProbabilityTable
from valostats.domain.enums import MatchSource
from valostats.domain.facts import SourceFacts
from valostats.repositories import facts_repository, map_repository, match_repository, squad_repository

logger = logging.getLogger(__name__)


def rebuild_facts(session: Session, source: MatchSource) -> None:
    matches = match_repository.load_payloads(session, source)
    maps = map_repository.load_all(session)
    squad = squad_repository.active_puuids(session) if source is MatchSource.SQUAD else None
    # Matches kept for extraction (known map, squad 5-stack), listed once and read by every extractor.
    contexts = list(matches_to_extract(matches, maps, squad))
    table = WinProbabilityTable.from_matches(matches)
    players = extract_players(contexts, table)
    facts = SourceFacts(
        matches=extract_matches(contexts),
        rounds=extract_rounds(contexts),
        kills=extract_kills(contexts),
        player_rounds=players.rounds,
        player_matches=players.matches,
        win_probability=table.cells(),
    )
    facts_repository.replace_source_facts(session, source, facts, len(matches))
    logger.info(
        "%s facts rebuilt: %d matches kept of %d, %d team rounds, %d kills",
        source.value,
        len(contexts),
        len(matches),
        len(facts.rounds),
        len(facts.kills),
    )
