"""Revenges: a death is avenged when a teammate kills the killer within the revenge window."""

from valostats.analysis.extraction.henrik_payload import HenrikKill
from valostats.constants.game import REVENGE_WINDOW_MS


def revenge_pairs(kills: list[HenrikKill]) -> dict[int, int]:
    """Index of each avenged kill mapped to the index of the kill that avenged it (kills in time order)."""
    pairs: dict[int, int] = {}
    for i, kill in enumerate(kills):
        for j in range(i + 1, len(kills)):
            later = kills[j]
            if later["time_in_round_in_ms"] - kill["time_in_round_in_ms"] > REVENGE_WINDOW_MS:
                break
            if later["victim"]["puuid"] == kill["killer"]["puuid"] and later["killer"]["team"] == kill["victim"]["team"]:
                pairs[i] = j
                break
    return pairs
