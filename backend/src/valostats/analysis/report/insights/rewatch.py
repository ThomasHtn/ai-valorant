"""Rounds to rewatch: the latest rounds behind a figure, one link per round."""

from collections.abc import Iterable
from datetime import datetime
from typing import Protocol

from valostats.constants.findings import MAX_REWATCH
from valostats.schemas.report.findings import RewatchRound


class RoundLike(Protocol):
    """Any fact tied to one round: round, player-round or kill facts."""

    @property
    def match_id(self) -> str: ...

    @property
    def round_index(self) -> int: ...

    @property
    def map_name(self) -> str: ...

    @property
    def started_at(self) -> datetime: ...


def rewatch_rounds(facts: Iterable[RoundLike], limit: int = MAX_REWATCH) -> list[RewatchRound]:
    """The latest distinct rounds of the facts, newest first (several deaths of one round give one link)."""
    newest_first = sorted(facts, key=lambda f: (f.started_at, f.round_index), reverse=True)
    seen: set[tuple[str, int]] = set()
    links: list[RewatchRound] = []
    for fact in newest_first:
        key = (fact.match_id, fact.round_index)
        if key in seen:
            continue
        seen.add(key)
        links.append(
            RewatchRound(
                match_id=fact.match_id,
                day=fact.started_at.date(),
                map_name=fact.map_name,
                round_number=fact.round_index + 1,
            )
        )
        if len(links) == limit:
            break
    return links
