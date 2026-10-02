"""Pointers to rounds worth rewatching."""

from collections.abc import Iterable
from datetime import datetime
from typing import Protocol

from valostats.constants.analysis import MAX_REWATCH_REFS
from valostats.schemas.common import RoundRef


class RoundLocated(Protocol):
    """Any fact tied to a round."""

    @property
    def match_id(self) -> str: ...

    @property
    def started_at(self) -> datetime: ...

    @property
    def map_name(self) -> str: ...

    @property
    def round_index(self) -> int: ...


def round_ref(fact: RoundLocated) -> RoundRef:
    return RoundRef(match_id=fact.match_id, started_at=fact.started_at, map_name=fact.map_name, round_number=fact.round_index + 1)


def latest_refs(facts: Iterable[RoundLocated], limit: int = MAX_REWATCH_REFS) -> list[RoundRef]:
    """The most recent rounds first, one reference per round."""
    latest = sorted(facts, key=lambda f: f.started_at, reverse=True)[:limit]
    refs: dict[tuple[str, int], RoundRef] = {}
    for fact in latest:
        refs.setdefault((fact.match_id, fact.round_index), round_ref(fact))
    return list(refs.values())
