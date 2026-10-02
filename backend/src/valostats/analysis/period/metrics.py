"""Metrics compared between the squad and its opponents, and tracked from one period to the next."""

from collections.abc import Callable
from dataclasses import dataclass

from valostats.domain.enums import BuyType, Side
from valostats.domain.facts import DeathFact, RoundFact
from valostats.schemas.period.findings import Noun

# Default wording; every compared metric sets its own.
NO_NOUN = Noun(one="", many="")


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
    # Name of the failures, so a point reads in its colour's direction ("Premiers duels perdus").
    opposite: str = ""
    # What a success and a failure are called in one match's figure ("3 throws sur 5").
    counted: tuple[Noun, Noun] = (NO_NOUN, NO_NOUN)
    # What the total of one match's figure counts ("sur 5 rounds à 2 joueurs d'avance").
    tries: Noun = NO_NOUN


ROUND_METRICS: list[Metric[RoundFact]] = [
    Metric(
        "won",
        "Rounds gagnés",
        lambda r: True,
        lambda r: r.won,
        True,
        "rounds",
        versus_half=True,
        both_sides=True,
        opposite="Rounds perdus",
        counted=(Noun(one="round gagné", many="rounds gagnés"), Noun(one="round perdu", many="rounds perdus")),
        tries=Noun(one="joué", many="joués"),
    ),
    Metric(
        "first_duel",
        "First bloods pris",
        lambda r: r.first_kill is not None,
        lambda r: bool(r.first_kill),
        True,
        "rounds",
        versus_half=True,
        opposite="First bloods concédés",
        counted=(Noun(one="first blood", many="first bloods"), Noun(one="first blood concédé", many="first bloods concédés")),
        tries=Noun(one="round", many="rounds"),
    ),
    Metric(
        "convert",
        "Rounds gagnés après un first blood",
        lambda r: r.first_kill is True,
        lambda r: r.won,
        True,
        "rounds",
        opposite="Rounds perdus après un first blood",
        counted=(Noun(one="round gagné", many="rounds gagnés"), Noun(one="round perdu", many="rounds perdus")),
        tries=Noun(one="après un first blood", many="après un first blood"),
    ),
    Metric(
        "recover",
        "Rounds gagnés après une first death",
        lambda r: r.first_kill is False,
        lambda r: r.won,
        True,
        "rounds",
        mirror=True,
        opposite="Rounds perdus après une first death",
        counted=(Noun(one="round gagné", many="rounds gagnés"), Noun(one="round perdu", many="rounds perdus")),
        tries=Noun(one="après une first death", many="après une first death"),
    ),
    Metric(
        "adv_lost",
        "Throws à 2 joueurs d'avance",
        lambda r: r.max_advantage >= 2,
        lambda r: not r.won,
        False,
        "rounds",
        opposite="Rounds gagnés à 2 joueurs d'avance",
        counted=(Noun(one="throw", many="throws"), Noun(one="avantage converti", many="avantages convertis")),
        tries=Noun(one="round à 2 joueurs d'avance", many="rounds à 2 joueurs d'avance"),
    ),
    Metric(
        "post_plant",
        "Post-plants gagnés",
        lambda r: r.planted,
        lambda r: r.won,
        True,
        "rounds",
        side=Side.ATTACK,
        mirror=True,
        opposite="Post-plants perdus",
        counted=(Noun(one="post-plant gagné", many="post-plants gagnés"), Noun(one="post-plant perdu", many="post-plants perdus")),
        tries=Noun(one="spike posé", many="spikes posés"),
    ),
    Metric(
        "retake",
        "Retakes réussis",
        lambda r: r.planted,
        lambda r: r.won,
        True,
        "rounds",
        side=Side.DEFENSE,
        opposite="Retakes ratés",
        counted=(Noun(one="retake réussi", many="retakes réussis"), Noun(one="retake raté", many="retakes ratés")),
        tries=Noun(one="spike posé par l'adversaire", many="spikes posés par l'adversaire"),
    ),
    Metric(
        "no_plant",
        "Attaques sans plant (hors eco)",
        lambda r: r.buy is not BuyType.ECO,
        lambda r: not r.planted,
        False,
        "rounds",
        side=Side.ATTACK,
        opposite="Attaques avec plant (hors eco)",
        counted=(Noun(one="attaque sans plant", many="attaques sans plant"), Noun(one="attaque avec plant", many="attaques avec plant")),
        tries=Noun(one="hors eco", many="hors eco"),
    ),
]

TRADED_DEATHS: Metric[DeathFact] = Metric(
    "traded",
    "Morts avec revenge",
    lambda d: True,
    lambda d: d.traded,
    True,
    "morts",
    opposite="Morts sans revenge",
    counted=(Noun(one="mort avec revenge", many="morts avec revenge"), Noun(one="mort sans revenge", many="morts sans revenge")),
    tries=Noun(one="mort", many="morts"),
)
ZERO_DAMAGE_DEATHS: Metric[DeathFact] = Metric(
    "no_damage",
    "Morts sans dégât infligé",
    lambda d: True,
    lambda d: d.damage == 0,
    False,
    "morts",
    opposite="Morts avec dégâts infligés",
    counted=(Noun(one="mort sans dégât", many="morts sans dégât"), Noun(one="mort avec dégâts", many="morts avec dégâts")),
    tries=Noun(one="mort", many="morts"),
)
DEATH_METRICS: list[Metric[DeathFact]] = [TRADED_DEATHS, ZERO_DAMAGE_DEATHS]

OPENING_DUELS_LABEL = "Premiers duels gagnés"
OPENING_DUELS_OPPOSITE = "Premiers duels perdus"
OPENING_DUELS_COUNTED = (Noun(one="duel gagné", many="duels gagnés"), Noun(one="duel perdu", many="duels perdus"))
OPENING_DUELS_TRIES = Noun(one="joué", many="joués")
