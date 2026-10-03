"""Round timelines: the ordered kills and plant of a round, with the players alive after each."""

from collections import defaultdict
from dataclasses import dataclass
from typing import Any, Literal

from valostats.analysis.extraction.henrik_payload import HenrikKill, HenrikMatch, alive_after, attacker
from valostats.constants.game import BLUE, RED, TEAM_SIZE


@dataclass(frozen=True, slots=True)
class TimelineEvent:
    kind: Literal["kill", "plant"]
    ms: int
    # The Henrik kill or plant object.
    data: dict[str, Any]


@dataclass(frozen=True, slots=True)
class RoundState:
    """Situation right after an event; the first state of a round has no event (5v5 at 0 ms)."""

    event: TimelineEvent | None
    alive: dict[str, int]
    planted: bool

    @property
    def ms(self) -> int:
        return self.event.ms if self.event else 0


@dataclass(frozen=True, slots=True)
class RoundTimeline:
    attacker: str
    winner: str
    states: tuple[RoundState, ...]

    @property
    def kills(self) -> list[HenrikKill]:
        return [s.event.data for s in self.states if s.event and s.event.kind == "kill"]


def round_timelines(match: HenrikMatch) -> dict[int, RoundTimeline]:
    """Timeline of every round of a match, keyed by 0-based round index."""
    kills_by_round: dict[int, list[HenrikKill]] = defaultdict(list)
    for kill in match["kills"]:
        kills_by_round[kill["round"]].append(kill)
    timelines = {}
    for rnd in match["rounds"]:
        events = [TimelineEvent("kill", k["time_in_round_in_ms"], k) for k in kills_by_round[rnd["id"]]]
        if rnd["plant"]:
            events.append(TimelineEvent("plant", rnd["plant"]["round_time_in_ms"], rnd["plant"]))
        # Stable sort: on a tie the kill stays before the plant.
        events.sort(key=lambda e: e.ms)
        alive, planted = {RED: TEAM_SIZE, BLUE: TEAM_SIZE}, False
        states = [RoundState(None, dict(alive), planted)]
        for event in events:
            if event.kind == "plant":
                planted = True
            else:
                alive = alive_after(event.data)
            states.append(RoundState(event, dict(alive), planted))
        timelines[rnd["id"]] = RoundTimeline(attacker(rnd["id"]), rnd["winning_team"], tuple(states))
    return timelines


def alive_before_kills(timeline: RoundTimeline) -> dict[int, dict[str, int]]:
    """Alive players per team right before each kill, keyed by `id()` of the Henrik kill object."""
    return {
        id(state.event.data): previous.alive
        for previous, state in zip(timeline.states, timeline.states[1:], strict=False)
        if state.event and state.event.kind == "kill"
    }
