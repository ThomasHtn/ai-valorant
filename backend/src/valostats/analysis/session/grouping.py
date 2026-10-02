"""Squad matches grouped into evenings."""

from collections.abc import Sequence
from dataclasses import dataclass
from datetime import date, datetime

from valostats.analysis.team.match_results import MatchResult, squad_matches
from valostats.constants.analysis import SESSION_GAP
from valostats.domain.facts import RoundFact


@dataclass(frozen=True)
class Session:
    matches: list[MatchResult]

    @property
    def day(self) -> date:
        return self.matches[0].started_at.date()

    @property
    def started_at(self) -> datetime:
        return self.matches[0].started_at

    @property
    def match_ids(self) -> set[str]:
        return {m.match_id for m in self.matches}


def sessions(rounds: Sequence[RoundFact]) -> list[Session]:
    """Oldest first; a new session starts after a 3 h gap between two matches."""
    groups: list[list[MatchResult]] = []
    for match in sorted(squad_matches(rounds).values(), key=lambda m: m.started_at):
        if groups and match.started_at - groups[-1][-1].started_at <= SESSION_GAP:
            groups[-1].append(match)
        else:
            groups.append([match])
    return [Session(g) for g in groups]
