"""Empirical chance of winning a round from a given situation (players alive, side, spike planted)."""

from collections import defaultdict
from collections.abc import Iterable

from valostats.analysis.extraction.henrik_payload import HenrikMatch, other_team
from valostats.analysis.extraction.timeline import round_timelines
from valostats.constants.game import TEAMS
from valostats.domain.enums import Side
from valostats.domain.facts import WinProbabilityCell

StateKey = tuple[int, int, Side, bool]


class WinProbabilityTable:
    """Outcome counts of every (own alive, opponents alive, side, planted) state seen in the matches."""

    def __init__(self, cells: Iterable[WinProbabilityCell]) -> None:
        self._counts: dict[StateKey, tuple[int, int]] = {(c.own_alive, c.opp_alive, c.side, c.planted): (c.wins, c.total) for c in cells}

    @classmethod
    def from_matches(cls, matches: Iterable[HenrikMatch]) -> "WinProbabilityTable":
        counts: dict[StateKey, list[int]] = defaultdict(lambda: [0, 0])
        for match in matches:
            for timeline in round_timelines(match).values():
                for state in timeline.states:
                    for team in TEAMS:
                        side = Side.ATTACK if team == timeline.attacker else Side.DEFENSE
                        key = (state.alive[team], state.alive[other_team(team)], side, state.planted)
                        counts[key][0] += timeline.winner == team
                        counts[key][1] += 1
        return cls(WinProbabilityCell(*key, wins, total) for key, (wins, total) in counts.items())

    def cells(self) -> list[WinProbabilityCell]:
        return [WinProbabilityCell(*key, wins, total) for key, (wins, total) in self._counts.items()]

    def probability(self, own_alive: int, opp_alive: int, side: Side, planted: bool) -> float:
        if own_alive == 0:
            return 0.0
        if opp_alive == 0:
            return 1.0
        wins, total = self._counts.get((own_alive, opp_alive, side, planted), (0, 0))
        # Laplace smoothing keeps rare states away from 0 and 1.
        return (wins + 1) / (total + 2)
