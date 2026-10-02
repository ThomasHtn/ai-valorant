"""valorant-api.com: map metadata (callouts, minimap images and projection)."""

from typing import Any

import httpx

from valostats.domain.maps import Callout, GameMap

MAPS_URL = "https://valorant-api.com/v1/maps"


def fetch_maps() -> list[GameMap]:
    response = httpx.get(MAPS_URL, timeout=60)
    response.raise_for_status()
    return parse_maps(response.json())


def parse_maps(payload: dict[str, Any]) -> list[GameMap]:
    """Maps with callouts only: the others (range, deathmatch arenas) are never analysed."""
    return [
        GameMap(
            name=m["displayName"],
            minimap_url=m["displayIcon"],
            x_multiplier=m["xMultiplier"],
            y_multiplier=m["yMultiplier"],
            x_scalar_to_add=m["xScalarToAdd"],
            y_scalar_to_add=m["yScalarToAdd"],
            callouts=tuple(
                Callout(f"{c['superRegionName']} {c['regionName']}", c["location"]["x"], c["location"]["y"]) for c in m["callouts"]
            ),
        )
        for m in payload["data"]
        if m.get("callouts")
    ]
