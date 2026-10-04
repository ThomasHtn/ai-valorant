"""Squad matches grouped into evenings (sessions), the unit of the home page."""

from collections.abc import Iterable
from dataclasses import dataclass
from datetime import date

from valostats.constants.report import EVENING_GAP
from valostats.domain.facts import MatchFact


@dataclass(frozen=True)
class Evening:
    """Consecutive squad matches, oldest first; its day is the day of its first match."""

    matches: tuple[MatchFact, ...]

    @property
    def day(self) -> date:
        return self.matches[0].started_at.date()

    @property
    def wins(self) -> int:
        return sum(m.won for m in self.matches)

    @property
    def losses(self) -> int:
        return len(self.matches) - self.wins


def evenings(matches: Iterable[MatchFact]) -> list[Evening]:
    """Oldest first; a new evening starts after `EVENING_GAP` without a match, on another day.

    A match played after midnight stays in the evening it belongs to, so the evening keeps its day. Two
    groups on the same day make one evening: a session report is asked by its day.
    """
    groups: list[list[MatchFact]] = []
    for match in sorted(matches, key=lambda m: m.started_at):
        last = groups[-1] if groups else None
        if last and (match.started_at - last[-1].started_at <= EVENING_GAP or match.started_at.date() == last[0].started_at.date()):
            last.append(match)
        else:
            groups.append([match])
    return [Evening(tuple(g)) for g in groups]
