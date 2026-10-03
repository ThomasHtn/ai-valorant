"""Game pictures shown in front of table rows: the front builds the image path from the slug."""

import re

from valostats.schemas.report.tables import ArtType, GameArt

_NON_ALPHANUMERIC = re.compile(r"[^a-z0-9]+")


def slug(name: str) -> str:
    """'KAY/O' -> 'kayo', 'Rondo de la mort' -> 'rondo-de-la-mort': the asset file names of the front."""
    return _NON_ALPHANUMERIC.sub("-", name.lower().replace("/", "")).strip("-")


def map_art(name: str) -> GameArt:
    return GameArt(type=ArtType.MAP, slug=slug(name))


def agent_art(name: str) -> GameArt:
    return GameArt(type=ArtType.AGENT, slug=slug(name))


def weapon_art(name: str) -> GameArt:
    return GameArt(type=ArtType.WEAPON, slug=slug(name))


def player_art(name: str) -> GameArt:
    """The front shows the player's main agent of the period."""
    return GameArt(type=ArtType.PLAYER, slug=name)
