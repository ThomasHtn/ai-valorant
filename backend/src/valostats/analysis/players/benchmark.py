"""Top ranked references for individual stats, by agent and by weapon."""

from collections import Counter, defaultdict
from collections.abc import Mapping, Sequence

from valostats.analysis.players.metrics import STATS, StatAccumulator
from valostats.domain.facts import PlayerRoundFact

AgentBenchmark = Mapping[str, StatAccumulator]


def benchmark_by_agent(top_player_rounds: Sequence[PlayerRoundFact]) -> dict[str, StatAccumulator]:
    by_agent: defaultdict[str, StatAccumulator] = defaultdict(StatAccumulator)
    for r in top_player_rounds:
        by_agent[r.agent].add(r)
    return dict(by_agent)


def mixed_benchmark(player_rounds: Sequence[PlayerRoundFact], by_agent: AgentBenchmark) -> dict[str, float | None]:
    """Top ranked reference weighted by the player's own agent mix, so a Sova player is compared to Sova players."""
    mix = Counter(r.agent for r in player_rounds)
    reference: dict[str, float | None] = {}
    for stat in STATS:
        weighted = weights = 0.0
        for agent, rounds in mix.items():
            value = by_agent[agent].mean(stat.key) if agent in by_agent else None
            if value is not None:
                weighted += rounds * value
                weights += rounds
        reference[stat.key] = weighted / weights if weights else None
    return reference


def weapon_benchmark(top_player_rounds: Sequence[PlayerRoundFact]) -> dict[str, float]:
    """Kills per round by weapon held, over top ranked players."""
    kills: Counter[str] = Counter()
    rounds: Counter[str] = Counter()
    for r in top_player_rounds:
        if r.weapon:
            kills[r.weapon] += r.kills
            rounds[r.weapon] += 1
    return {weapon: kills[weapon] / n for weapon, n in rounds.items()}
