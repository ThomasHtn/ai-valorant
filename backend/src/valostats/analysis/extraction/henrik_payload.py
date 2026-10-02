"""Read-only helpers over a raw Henrik v4 match payload.

The payload is kept as a plain dict: it is large and only a few fields are read. The fields used
are `metadata`, `players`, `teams`, `rounds` (with `stats` and `plant`) and `kills`.
"""

from collections import Counter
from collections.abc import Collection
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

from valostats.constants.game import BLUE, HALF_LENGTH, LOCAL_TIMEZONE, OVERTIME_START, RED, TEAM_SIZE, TEAMS

HenrikMatch = dict[str, Any]
HenrikKill = dict[str, Any]

LOCAL_TZ = ZoneInfo(LOCAL_TIMEZONE)


def match_id(match: HenrikMatch) -> str:
    return str(match["metadata"]["match_id"])


def map_name(match: HenrikMatch) -> str:
    return str(match["metadata"]["map"]["name"])


def started_at(match: HenrikMatch) -> datetime:
    """Start time in the squad's time zone."""
    return datetime.fromisoformat(match["metadata"]["started_at"].replace("Z", "+00:00")).astimezone(LOCAL_TZ)


def patch(match: HenrikMatch) -> str:
    """Game patch, e.g. '13.05' from 'release-13.05-shipping-...'."""
    return str(match["metadata"]["game_version"].split("-")[1])


def region(match: HenrikMatch) -> str:
    return str(match["metadata"].get("region") or "")


def other_team(team: str) -> str:
    return BLUE if team == RED else RED


def is_team(team: str) -> bool:
    """False for the pseudo teams Henrik uses on environmental kills."""
    return team in TEAMS


def attacker(round_index: int) -> str:
    """Team on attack: Red first, sides swap at the half, then every round in overtime."""
    if round_index < HALF_LENGTH:
        return RED
    if round_index < OVERTIME_START:
        return BLUE
    return RED if (round_index - OVERTIME_START) % 2 == 0 else BLUE


def alive_after(kill: HenrikKill) -> dict[str, int]:
    """Alive players per team right after a kill."""
    # The kill snapshot lists exactly the players alive after it, revives included.
    alive = Counter(p["player"]["team"] for p in kill["player_locations"])
    return {RED: alive[RED], BLUE: alive[BLUE]}


def squad_team(match: HenrikMatch, squad: Collection[str]) -> str | None:
    """Team holding at least five squad players, or None when the squad did not 5-stack."""
    counts = Counter(p["team_id"] for p in match["players"] if p["puuid"] in squad)
    if not counts:
        return None
    team, n = counts.most_common(1)[0]
    return str(team) if n >= TEAM_SIZE else None
