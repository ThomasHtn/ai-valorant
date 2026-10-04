"""Read-only helpers over a raw Henrik v4 match payload.

The payload is kept as a plain dict: it is large and only a few fields are read. The fields used
are `metadata`, `players`, `teams`, `rounds` (with `stats` and `plant`) and `kills`.
"""

from collections import Counter
from collections.abc import Collection
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

from valostats.constants.game import (
    BLUE,
    HALF_LENGTH,
    LOCAL_TIMEZONE,
    MELEE_WEAPONS,
    OVERTIME_START,
    RED,
    SURRENDER_RESULT,
    TEAM_SIZE,
    TEAMS,
    WEAPON_TYPE_ABILITY,
    WEAPON_TYPE_FALL,
    WEAPON_TYPE_GUN,
    WEAPON_TYPE_MELEE,
    WEAPON_TYPE_SPIKE,
)
from valostats.domain.enums import KillMeans
from valostats.domain.facts import Location

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


def played_rounds(match: HenrikMatch) -> list[dict[str, Any]]:
    """Rounds actually played: the empty rounds Henrik appends after a surrender are left out."""
    return [rnd for rnd in match["rounds"] if rnd["result"] != SURRENDER_RESULT]


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


def is_duel(kill: HenrikKill) -> bool:
    """A player killed by an opponent: self-kills (spike, fall, Clove's ultimate), teamkills and environment kills are not."""
    killer_team = kill["killer"]["team"]
    return is_team(killer_team) and killer_team != kill["victim"]["team"]


def opening_index(kills: list[HenrikKill]) -> int | None:
    """Index of the round's first duel (kills in time order), None when nobody was killed by an opponent."""
    return next((i for i, kill in enumerate(kills) if is_duel(kill)), None)


def is_enemy_hit(event: dict[str, Any], team: str) -> bool:
    """A damage event of a player of `team` on an opponent (Henrik also lists hits on teammates)."""
    return (event.get("player") or {}).get("team") != team


def alive_at_start(first_kill: HenrikKill | None) -> dict[str, int]:
    """Players in the round: the first kill's snapshot plus its victim; a disconnected player is in no snapshot."""
    if first_kill is None:
        return {RED: TEAM_SIZE, BLUE: TEAM_SIZE}
    alive = alive_after(first_kill)
    alive[first_kill["victim"]["team"]] += 1
    return {team: min(TEAM_SIZE, count) for team, count in alive.items()}


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


def game_length_ms(match: HenrikMatch) -> int | None:
    return match["metadata"].get("game_length_in_ms")


def cluster(match: HenrikMatch) -> str | None:
    """Game server, e.g. 'Frankfurt'."""
    return match["metadata"].get("cluster")


def location(point: dict[str, Any]) -> Location:
    return Location(point["x"], point["y"])


def snapshot_location(kill: HenrikKill, puuid: str) -> Location | None:
    """Where a player stood when the kill happened, read from the kill snapshot."""
    spot = next((q["location"] for q in kill["player_locations"] if q["player"]["puuid"] == puuid), None)
    return location(spot) if spot else None


def weapon_name(kill: HenrikKill) -> str | None:
    return (kill.get("weapon") or {}).get("name") or None


def kill_means(kill: HenrikKill) -> KillMeans:
    """What the kill was made with. An unnamed "Weapon" is a Chamber or Neon ultimate, so an ability."""
    weapon = kill.get("weapon") or {}
    kind, name = weapon.get("type"), weapon.get("name")
    if kind == WEAPON_TYPE_GUN or (kind is None and name):
        if not name:
            return KillMeans.ABILITY
        return KillMeans.MELEE if name in MELEE_WEAPONS else KillMeans.WEAPON
    return {
        WEAPON_TYPE_MELEE: KillMeans.MELEE,
        WEAPON_TYPE_ABILITY: KillMeans.ABILITY,
        WEAPON_TYPE_SPIKE: KillMeans.SPIKE,
        WEAPON_TYPE_FALL: KillMeans.FALL,
    }.get(kind or "", KillMeans.OTHER)


def tier(player: dict[str, Any]) -> tuple[int | None, str | None]:
    """Competitive tier id and name; (None, None) when unranked (Henrik sends id 0)."""
    raw = player.get("tier") or {}
    return (raw.get("id"), raw.get("name")) if raw.get("id") else (None, None)


def team_tiers(match: HenrikMatch) -> dict[str, float | None]:
    """Average tier id of each team's ranked players."""
    ids: dict[str, list[int]] = {team: [] for team in TEAMS}
    for player in match["players"]:
        tier_id = tier(player)[0]
        if tier_id and player["team_id"] in ids:
            ids[player["team_id"]].append(tier_id)
    return {team: sum(values) / len(values) if values else None for team, values in ids.items()}
