"""Situations of the Escouade view: each one is a share of squad rounds, compared with the top ranked."""

from collections.abc import Callable
from dataclasses import dataclass

from valostats.domain.enums import BuyType, Side
from valostats.domain.facts import RoundFact
from valostats.schemas.report.squad import SituationGroup

RoundTest = Callable[[RoundFact], bool]
# Second round of each half (index 1 and 13).
BONUS_ROUNDS = (1, 13)


def _won(r: RoundFact) -> bool:
    return r.won


def _reached(state: str) -> RoundTest:
    return lambda r: state in r.states


@dataclass(frozen=True)
class SituationRule:
    key: str
    label: str
    detail: str
    group: SituationGroup
    among: RoundTest
    success: RoundTest = _won


SITUATIONS: tuple[SituationRule, ...] = (
    SituationRule(
        "conversion",
        "Convertir le 5 contre 4",
        "rounds gagnés après un first blood pour nous",
        SituationGroup.OPENING,
        lambda r: r.first_kill is True,
    ),
    SituationRule(
        "recovery",
        "Rattraper le 4 contre 5",
        "rounds gagnés après un first blood pour l'adversaire",
        SituationGroup.OPENING,
        lambda r: r.first_kill is False,
    ),
    SituationRule(
        "duel-attack",
        "Premier duel en attaque",
        "premiers duels gagnés en attaque",
        SituationGroup.OPENING,
        lambda r: r.side is Side.ATTACK and r.first_kill is not None,
        lambda r: r.first_kill is True,
    ),
    SituationRule(
        "duel-defense",
        "Premier duel en défense",
        "premiers duels gagnés en défense",
        SituationGroup.OPENING,
        lambda r: r.side is Side.DEFENSE and r.first_kill is not None,
        lambda r: r.first_kill is True,
    ),
    SituationRule(
        "clutch-1v1", "Clutch 1 contre 1", "rounds gagnés passés par un 1 contre 1", SituationGroup.OPENING, lambda r: "1v1" in r.states
    ),
    SituationRule(
        "clutch-1v2", "Clutch 1 contre 2", "rounds gagnés passés par un 1 contre 2", SituationGroup.OPENING, lambda r: "1v2" in r.states
    ),
    SituationRule("pistol", "Pistol", "rounds 1 et 13 gagnés", SituationGroup.ECONOMY, lambda r: r.buy is BuyType.PISTOL),
    SituationRule(
        "bonus",
        "Round bonus",
        "round 2 ou 14 gagné après un pistol gagné",
        SituationGroup.ECONOMY,
        lambda r: r.round_index in BONUS_ROUNDS and r.pistol_won is True,
    ),
    SituationRule("full", "Full buy", "rounds gagnés en full buy", SituationGroup.ECONOMY, lambda r: r.buy is BuyType.FULL),
    SituationRule("force", "Force buy", "rounds gagnés en force buy", SituationGroup.ECONOMY, lambda r: r.buy is BuyType.FORCE),
    SituationRule("eco", "Éco", "rounds gagnés en éco", SituationGroup.ECONOMY, lambda r: r.buy is BuyType.ECO),
    SituationRule(
        "post-plant",
        "Post-plant",
        "rounds d'attaque gagnés une fois le spike posé",
        SituationGroup.SPIKE,
        lambda r: r.side is Side.ATTACK and r.planted,
    ),
    SituationRule(
        "retake",
        "Retakes",
        "rounds de défense gagnés une fois le spike posé",
        SituationGroup.SPIKE,
        lambda r: r.side is Side.DEFENSE and r.planted,
    ),
)
