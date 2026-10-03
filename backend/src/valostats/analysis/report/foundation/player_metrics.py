"""Metrics on player-rounds shared by the player sheet and the agent pool: ACS, K/D, KAST, opening duels...

Each one is a `Metric` (`facts -> (value, sample)`, see `cells.py`), so it works on any cohort.
"""

from collections.abc import Sequence

from valostats.analysis.report.foundation.cells import Measure, Metric, ratio, sum_ratio
from valostats.domain.facts import PlayerRoundFact

acs: Metric = sum_ratio(lambda r: r.score)
adr: Metric = sum_ratio(lambda r: r.damage)
kast: Metric = ratio(lambda r: r.kast)
rounds_won: Metric = ratio(lambda r: r.won)
fbfd_per_round: Metric = sum_ratio(lambda r: r.first_blood - r.first_death)
first_deaths_per_round: Metric = sum_ratio(lambda r: r.first_death)
# Shares of the player's deaths.
revenge_rate: Metric = ratio(lambda r: r.traded, lambda r: r.deaths > 0)
zero_damage_rate: Metric = ratio(lambda r: r.zero_damage_death, lambda r: r.deaths > 0)
won_after_first_blood: Metric = ratio(lambda r: r.won, lambda r: r.first_blood)
won_after_first_death: Metric = ratio(lambda r: r.won, lambda r: r.first_death)


def kd(rows: Sequence[PlayerRoundFact]) -> Measure:
    """Kills over deaths; the sample is the number of rounds."""
    deaths = sum(r.deaths for r in rows)
    return (sum(r.kills for r in rows) / deaths if deaths else None), len(rows)


def headshot_rate(rows: Sequence[PlayerRoundFact]) -> Measure:
    """Headshots over shots that hit; the sample is the number of hits."""
    shots = sum(r.shots for r in rows)
    return (sum(r.headshots for r in rows) / shots if shots else None), shots


def opening_duels_won(rows: Sequence[PlayerRoundFact]) -> Measure:
    """First bloods over opening duels (first bloods plus first deaths)."""
    duels = sum(r.first_blood + r.first_death for r in rows)
    return (sum(r.first_blood for r in rows) / duels if duels else None), duels
