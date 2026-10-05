"""Rebuild every fact of a source from the stored raw matches.

The whole source is rebuilt, not only new matches: the impact of a kill depends on the win
probability table, which itself depends on every match of the source. Payloads are read in small
batches, twice (the table first, then the facts), so memory stays flat whatever the volume.
"""

import logging
from collections.abc import Iterator, Sequence

from sqlalchemy.orm import Session

from valostats.analysis.extraction.context import matches_to_extract
from valostats.analysis.extraction.henrik_payload import HenrikMatch
from valostats.analysis.extraction.kill_facts import extract_kills
from valostats.analysis.extraction.match_facts import extract_matches
from valostats.analysis.extraction.player_facts import extract_players
from valostats.analysis.extraction.round_facts import extract_rounds
from valostats.analysis.extraction.win_probability import WinProbabilityTable
from valostats.domain.enums import MatchSource
from valostats.domain.facts import SourceFacts
from valostats.repositories import facts_repository, map_repository, match_repository, squad_repository

logger = logging.getLogger(__name__)

# Raw matches held in memory at once (about 0.4 MB each).
PAYLOAD_BATCH = 100


def rebuild_facts(session: Session, source: MatchSource) -> None:
    ids = match_repository.ids(session, source)
    maps = map_repository.load_all(session)
    squad = squad_repository.active_puuids(session) if source is MatchSource.SQUAD else None
    table = WinProbabilityTable.from_matches(_payloads(session, ids))
    # Squad player impact reads the top ranked table, like the round sheets: the squad's matches are too few.
    top_cells = facts_repository.load_win_probability(session, MatchSource.TOP) if source is MatchSource.SQUAD else []
    impact_table = WinProbabilityTable(top_cells) if top_cells else table
    facts_repository.clear_source_facts(session, source)
    kept = rounds = kills = 0
    for batch in _batches(session, ids):
        # Matches kept for extraction (known map, squad 5-stack), listed once and read by every extractor.
        contexts = list(matches_to_extract(batch, maps, squad))
        players = extract_players(contexts, impact_table)
        facts = SourceFacts(
            matches=extract_matches(contexts),
            rounds=extract_rounds(contexts),
            kills=extract_kills(contexts),
            player_rounds=players.rounds,
            player_matches=players.matches,
        )
        facts_repository.insert_facts(session, facts)
        kept, rounds, kills = kept + len(contexts), rounds + len(facts.rounds), kills + len(facts.kills)
    facts_repository.finish_build(session, source, table.cells(), len(ids))
    logger.info("%s facts rebuilt: %d matches kept of %d, %d team rounds, %d kills", source.value, kept, len(ids), rounds, kills)


def _batches(session: Session, ids: Sequence[str]) -> Iterator[list[HenrikMatch]]:
    for start in range(0, len(ids), PAYLOAD_BATCH):
        yield match_repository.load_payloads_by_ids(session, ids[start : start + PAYLOAD_BATCH])


def _payloads(session: Session, ids: Sequence[str]) -> Iterator[HenrikMatch]:
    for batch in _batches(session, ids):
        yield from batch
