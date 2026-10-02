"""French labels returned by the API and shown as is to the squad (Valorant jargon kept in English)."""

from valostats.domain.enums import BuyType, Side

MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]
WEEKDAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

SIDE_LABELS = {Side.ATTACK: "Attaque", Side.DEFENSE: "Défense"}
BUY_LABELS = {BuyType.PISTOL: "pistol round", BuyType.ECO: "eco", BuyType.FORCE: "force buy", BuyType.FULL: "full buy"}

ALL_MAPS = "Toutes cartes"
