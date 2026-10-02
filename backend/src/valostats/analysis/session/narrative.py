"""French explanation of how a favourable round was lost, built from the events after the peak."""

from collections import Counter
from collections.abc import Iterable, Sequence
from dataclasses import dataclass

from valostats.domain.enums import Side

ENDINGS = {"Detonate": "le spike explose", "Defuse": "l'adversaire defuse", "Elimination": "toute l'équipe est éliminée"}
# A death spot or a killer becomes the story of the round from this many deaths.
MIN_GROUPED_DEATHS = 3


@dataclass(frozen=True)
class PlantAfterPeak:
    ours: bool
    site: str
    time: str
    # Situation just before the plant ("4v3") and the squad's advantage then.
    state_before: str
    advantage_before: int


@dataclass(frozen=True)
class DeathAfterPeak:
    name: str
    spot: str
    ms: int
    killer: str
    revenge: bool
    # Opponents alive when the victim was the last squad player, 0 otherwise.
    alone_versus: int


def clock(ms: int) -> str:
    seconds = round(ms / 1000)
    return f"{seconds // 60}:{seconds % 60:02d}"


def join_french(parts: Iterable[str]) -> str:
    items = list(parts)
    return items[0] if len(items) == 1 else ", ".join(items[:-1]) + " et " + items[-1]


def explain(
    side: Side, plant: PlantAfterPeak | None, deaths: Sequence[DeathAfterPeak], ending: str, planted_at_peak: bool
) -> tuple[str, list[str]]:
    """(headline, notes): the first matching pattern gives the headline, every pattern adds a note."""
    notes: list[str] = []
    headline: str | None = None
    if planted_at_peak:
        headline = "Post-plant perdu" if side is Side.ATTACK else "Retake raté en supériorité"
    if plant and not plant.ours and side is Side.DEFENSE:
        notes.append(f"L'adversaire plante {plant.site} à {plant.time} alors que vous êtes en {plant.state_before}.")
        if plant.advantage_before > 0:
            headline = headline or "Retake raté en supériorité"
    if plant and plant.ours:
        notes.append(f"Vous plantez {plant.site} à {plant.time} en {plant.state_before}.")
        if plant.advantage_before >= 0:
            headline = headline or "Post-plant perdu"

    spots = Counter(d.spot for d in deaths)
    spot, deaths_at_spot = spots.most_common(1)[0] if spots else (None, 0)
    if deaths_at_spot >= MIN_GROUPED_DEATHS:
        same = [d for d in deaths if d.spot == spot]
        span = round((same[-1].ms - same[0].ms) / 1000)
        notes.append(f"{join_french(d.name for d in same)} meurent tous à {spot}, en {span} s.")
        headline = headline or (f"Entrée qui tourne mal à {spot}" if side is Side.ATTACK else f"{spot} tombe d'un coup")
    elif len(deaths) >= MIN_GROUPED_DEATHS and len(spots) >= MIN_GROUPED_DEATHS:
        revenges = sum(d.revenge for d in deaths)
        revenge_text = "aucune revenge" if revenges == 0 else "une seule revenge" if revenges == 1 else f"{revenges} revenges"
        notes.append(
            f"Vous perdez {len(deaths)} joueurs à {len(spots)} endroits différents ({join_french(spots)}), avec {revenge_text} : "
            "personne n'était là pour reprendre le duel."
        )
        headline = headline or "Avantage perdu en duels isolés"

    killers = Counter(d.killer for d in deaths)
    killer, kills = killers.most_common(1)[0] if killers else (None, 0)
    if kills >= MIN_GROUPED_DEATHS:
        notes.append(f"{killer} enchaîne {kills} kills.")
        headline = headline or f"{killer} retourne le round"
    last = deaths[-1] if deaths else None
    if last and last.alone_versus:
        notes.append(f"{last.name} se retrouve en 1v{last.alone_versus} et perd le clutch.")
        headline = headline or "Clutch perdu"
    notes.append(f"Fin du round : {ENDINGS.get(ending, 'le temps est écoulé')}.")
    return headline or "Avantage perdu", notes
