"""Matches to extract, with what every fact of a match shares."""

from collections.abc import Collection, Iterable, Iterator, Mapping
from dataclasses import dataclass
from datetime import datetime
from typing import TypedDict

from valostats.analysis.extraction.cohorts import CohortOf, cohort_labeler
from valostats.analysis.extraction.henrik_payload import HenrikMatch, map_name, match_id, patch, started_at
from valostats.domain.maps import GameMap


class FactBase(TypedDict):
    """Fields every fact of a match starts with."""

    match_id: str
    started_at: datetime
    patch: str
    map_name: str


@dataclass(frozen=True, slots=True)
class MatchContext:
    """A match kept for extraction: its map, how its teams are labelled, and the common fact fields."""

    match: HenrikMatch
    game_map: GameMap
    cohort_of: CohortOf
    match_id: str
    started_at: datetime
    patch: str

    @property
    def base(self) -> FactBase:
        return {"match_id": self.match_id, "started_at": self.started_at, "patch": self.patch, "map_name": self.game_map.name}


def matches_to_extract(
    matches: Iterable[HenrikMatch], maps: Mapping[str, GameMap], squad: Collection[str] | None
) -> Iterator[MatchContext]:
    """Matches with known callouts and, for a squad extraction, a squad 5-stack (see `cohort_labeler`)."""
    for match in matches:
        game_map = maps.get(map_name(match))
        cohort_of = cohort_labeler(match, squad)
        if game_map is None or cohort_of is None:
            continue
        yield MatchContext(match, game_map, cohort_of, match_id(match), started_at(match), patch(match))
