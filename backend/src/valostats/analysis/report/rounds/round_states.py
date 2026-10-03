"""Situations a team went through in a round (players alive, spike), rebuilt from the kill facts.

Used by the rounds list to find each round's best moment (the live situation where the team's chance
of winning, read from the top ranked win probability table, was the highest) and its biggest swing.
"""

from collections import defaultdict
from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from itertools import pairwise

from valostats.analysis.extraction.win_probability import WinProbabilityTable
from valostats.constants.game import TEAM_SIZE
from valostats.domain.facts import KillFact, RoundFact

RoundKey = tuple[str, int]


@dataclass(frozen=True, slots=True)
class TeamState:
    own: int
    opp: int
    planted: bool

    @property
    def label(self) -> str:
        return f"{self.own}v{self.opp}"


@dataclass(frozen=True, slots=True)
class BestMoment:
    state: str
    probability: float


def kills_by_round(kills: Iterable[KillFact]) -> dict[RoundKey, list[KillFact]]:
    """Kills grouped by (match, round index), in time order."""
    grouped: dict[RoundKey, list[KillFact]] = defaultdict(list)
    for kill in kills:
        grouped[(kill.match_id, kill.round_index)].append(kill)
    for round_kills in grouped.values():
        round_kills.sort(key=lambda k: k.ms)
    return dict(grouped)


def team_states(fact: RoundFact, kills: Sequence[KillFact]) -> list[TeamState]:
    """The start (5v5), the situation right before each kill, then the end of the round.

    A kill's snapshot gives the alive counts before it, so revives and missing players are taken as
    the game recorded them. Teamkills are skipped: their snapshot only tells about one team.
    """
    states = [TeamState(TEAM_SIZE, TEAM_SIZE, planted=False)]
    for kill in kills:
        if kill.teamkill:
            continue
        own_died = kill.victim_team == fact.team_id
        own = kill.victim_team_alive if own_died else kill.killer_team_alive
        opp = kill.killer_team_alive if own_died else kill.victim_team_alive
        states.append(TeamState(own, opp, planted=kill.post_plant))
    states.append(TeamState(fact.alive_end, fact.opp_alive_end, planted=fact.planted))
    return states


def best_moment(fact: RoundFact, states: Sequence[TeamState], table: WinProbabilityTable) -> BestMoment | None:
    """Live situation (both teams alive) with the team's highest chance of winning; ties keep the earliest."""
    best: BestMoment | None = None
    for state in states:
        if not state.own or not state.opp:
            continue
        probability = table.probability(state.own, state.opp, fact.side, state.planted)
        if best is None or probability > best.probability:
            best = BestMoment(state.label, probability)
    return best


def biggest_drop(fact: RoundFact, states: Sequence[TeamState], table: WinProbabilityTable) -> float:
    """Largest fall of the team's chance between two consecutive moments, the round's end counting as 1 or 0."""
    chances = [table.probability(s.own, s.opp, fact.side, s.planted) for s in states if s.own and s.opp]
    chances.append(1.0 if fact.won else 0.0)
    drops = [before - after for before, after in pairwise(chances)]
    return max([0.0, *drops])
