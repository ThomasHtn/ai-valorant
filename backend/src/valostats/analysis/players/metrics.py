"""Individual statistics: their definitions and how they accumulate over player rounds."""

from collections import defaultdict
from collections.abc import Iterable
from dataclasses import dataclass
from enum import StrEnum

from valostats.analysis.statistics.proportions import mean_vs_reference, one_proportion
from valostats.domain.facts import PlayerRoundFact


class StatKind(StrEnum):
    # Mean of a per-round value (kills per round) or share of a subset (headshots out of shots).
    MEAN = "mean"
    RATE = "rate"


@dataclass(frozen=True)
class StatDefinition:
    key: str
    label: str
    kind: StatKind
    higher_is_better: bool
    # Display hints for the front end.
    decimals: int
    signed: bool
    definition: str


STATS = [
    StatDefinition("acs", "ACS", StatKind.MEAN, True, 0, False, "Score de combat moyen par round (kills, dégâts, multi-kills, assists)."),
    StatDefinition("kpr", "Kills par round", StatKind.MEAN, True, 2, False, "Nombre moyen de kills par round."),
    StatDefinition("dpr", "Morts par round", StatKind.MEAN, False, 2, False, "Nombre moyen de morts par round."),
    StatDefinition("apr", "Assists par round", StatKind.MEAN, True, 2, False, "Nombre moyen d'assists par round."),
    StatDefinition("adr", "ADR", StatKind.MEAN, True, 0, False, "Dégâts infligés par round."),
    StatDefinition(
        "kast", "KAST", StatKind.RATE, True, 0, False, "Part des rounds avec un kill, un assist, une survie ou une mort revenge."
    ),
    StatDefinition("survival", "Survie", StatKind.RATE, True, 0, False, "Part des rounds où le joueur est vivant à la fin."),
    StatDefinition("hs", "Headshots", StatKind.RATE, True, 0, False, "Part des tirs touchés à la tête."),
    StatDefinition("fbpr", "First bloods par round", StatKind.MEAN, True, 2, False, "Kills d'ouverture par round."),
    StatDefinition("fdpr", "First deaths par round", StatKind.MEAN, False, 2, False, "Morts d'ouverture par round."),
    StatDefinition("opening", "Duels d'ouverture gagnés", StatKind.RATE, True, 0, False, "First bloods / (first bloods + first deaths)."),
    StatDefinition(
        "revenge_given",
        "Revenges données par round",
        StatKind.MEAN,
        True,
        2,
        False,
        "Kills qui vengent un coéquipier mort dans les 3 secondes.",
    ),
    StatDefinition(
        "traded", "Morts avec revenge", StatKind.RATE, True, 0, False, "Part de ses morts vengées par un coéquipier dans les 3 secondes."
    ),
    StatDefinition(
        "zero_dmg", "Morts à 0 dégât", StatKind.RATE, False, 0, False, "Part de ses morts sans avoir infligé de dégâts dans le round."
    ),
    StatDefinition("multi", "Rounds à 2 kills ou plus", StatKind.RATE, True, 0, False, "Part des rounds avec au moins 2 kills."),
    StatDefinition(
        "impact",
        "Impact",
        StatKind.MEAN,
        True,
        1,
        True,
        "Points de chances de victoire gagnés ou perdus par round, via ses kills, morts et plants.",
    ),
]
STATS_BY_KEY = {s.key: s for s in STATS}


class StatAccumulator:
    """Running sum, count and sum of squares of every statistic."""

    def __init__(self, rows: Iterable[PlayerRoundFact] = ()) -> None:
        self._acc: defaultdict[str, list[float]] = defaultdict(lambda: [0.0, 0, 0.0])
        for row in rows:
            self.add(row)

    def _add(self, key: str, value: float) -> None:
        a = self._acc[key]
        a[0] += value
        a[1] += 1
        a[2] += value * value

    def add(self, r: PlayerRoundFact) -> None:
        self._add("acs", r.score)
        self._add("kpr", r.kills)
        self._add("dpr", r.deaths)
        self._add("apr", r.assists)
        self._add("adr", r.damage)
        self._add("kast", r.kast)
        self._add("survival", r.survived)
        self._add("fbpr", r.first_blood)
        self._add("fdpr", r.first_death)
        self._add("revenge_given", r.revenge_given)
        self._add("multi", r.kills >= 2)
        self._add("impact", 100 * r.win_probability_added)
        if r.shots:
            # Headshots are a share of shots, not of rounds.
            self._acc["hs"][0] += r.headshots
            self._acc["hs"][1] += r.shots
        if r.first_blood or r.first_death:
            self._add("opening", r.first_blood)
        if r.deaths:
            self._add("traded", r.traded)
            self._add("zero_dmg", r.zero_damage_death)

    def mean(self, key: str) -> float | None:
        total, n, _ = self._acc.get(key, (0, 0, 0))
        return total / n if n else None

    def p_value(self, key: str, reference: float | None) -> float:
        """p-value of the value against a reference treated as exact (large benchmark samples)."""
        total, n, squares = self._acc.get(key, (0, 0, 0))
        if not n or reference is None:
            return 1.0
        if STATS_BY_KEY[key].kind is StatKind.RATE:
            return one_proportion(round(total), int(n), reference) if 0 < reference < 1 else 1.0
        return mean_vs_reference(total, int(n), squares, reference)
