"""Metrics compared between the squad and its opponents, and tracked from one period to the next."""

from collections.abc import Callable
from dataclasses import dataclass

from valostats.domain.enums import BuyType, Side
from valostats.domain.facts import DeathFact, RoundFact


@dataclass(frozen=True)
class Metric[T]:
    key: str
    label: str
    # Rows the metric applies to, and the rows that count as a success among them.
    applies: Callable[[T], bool]
    success: Callable[[T], bool]
    higher_is_better: bool
    unit: str
    # Only meaningful on this side.
    side: Side | None = None
    # The opponents' rate on the same side mirrors ours on the other side: test against 50 % instead.
    versus_half: bool = False
    # Only meaningful over both sides (attack wins more than defense).
    both_sides: bool = False
    # The opponents' rate equals 1 minus another of our metrics: kept for the evolution only.
    mirror: bool = False


ROUND_METRICS: list[Metric[RoundFact]] = [
    Metric("won", "Rounds gagnés", lambda r: True, lambda r: r.won, True, "rounds", versus_half=True, both_sides=True),
    Metric(
        "first_duel", "First blood pris", lambda r: r.first_kill is not None, lambda r: bool(r.first_kill), True, "rounds", versus_half=True
    ),
    Metric("convert", "Round gagné après le first blood (5v4)", lambda r: r.first_kill is True, lambda r: r.won, True, "rounds"),
    Metric(
        "recover", "Round gagné après la first death (4v5)", lambda r: r.first_kill is False, lambda r: r.won, True, "rounds", mirror=True
    ),
    Metric("adv_lost", "Throw en avantage de 2+ (5v3, 4v2…)", lambda r: r.max_advantage >= 2, lambda r: not r.won, False, "rounds"),
    Metric("post_plant", "Post-plant gagné", lambda r: r.planted, lambda r: r.won, True, "rounds", side=Side.ATTACK, mirror=True),
    Metric("retake", "Retake réussi", lambda r: r.planted, lambda r: r.won, True, "rounds", side=Side.DEFENSE),
    Metric(
        "no_plant",
        "Rounds d'attaque sans plant (hors eco)",
        lambda r: r.buy is not BuyType.ECO,
        lambda r: not r.planted,
        False,
        "rounds",
        side=Side.ATTACK,
    ),
]

TRADED_DEATHS: Metric[DeathFact] = Metric("traded", "Morts avec revenge", lambda d: True, lambda d: d.traded, True, "morts")
ZERO_DAMAGE_DEATHS: Metric[DeathFact] = Metric("no_damage", "Morts à 0 dégât", lambda d: True, lambda d: d.damage == 0, False, "morts")
DEATH_METRICS: list[Metric[DeathFact]] = [TRADED_DEATHS, ZERO_DAMAGE_DEATHS]

OPENING_DUELS_LABEL = "Duels d'ouverture gagnés"
