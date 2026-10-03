"""Synthetic Henrik v4 matches, small enough to reason about in a test.

Players are named R1..R5 (Red) and B1..B5 (Blue); their puuid is their name in lower case.
Red attacks in rounds 1 to 12. Every player is Platinum 1 (tier 15) and buys a Vandal and heavy armor.
In a kill snapshot every living player stands at (kill.x, 100) unless `positions` says otherwise.
"""

from dataclasses import dataclass, field
from typing import Any

from valostats.domain.maps import Callout, GameMap

RED = [f"R{i}" for i in range(1, 6)]
BLUE = [f"B{i}" for i in range(1, 6)]

# Two callouts far apart: kills at x < 0 land on "A Site", the others on "B Site".
TEST_MAP = GameMap(
    name="Ascent",
    minimap_url="https://example.test/ascent.png",
    x_multiplier=0.0001,
    y_multiplier=-0.0001,
    x_scalar_to_add=0.5,
    y_scalar_to_add=0.5,
    callouts=(Callout("A Site", -1000, 0), Callout("B Site", 1000, 0)),
)


def team_of(name: str) -> str:
    return "Red" if name.startswith("R") else "Blue"


@dataclass
class Kill:
    ms: int
    killer: str
    victim: str
    # x < 0 is A Site.
    x: float = -1000
    weapon: str | None = "Vandal"
    weapon_type: str = "Weapon"
    # Snapshot positions overriding the default (kill.x, 100), by player name.
    positions: dict[str, tuple[float, float]] = field(default_factory=dict)


@dataclass
class RoundSpec:
    winner: str
    kills: list[Kill] = field(default_factory=list)
    # (ms, site, planter)
    plant: tuple[int, str, str] | None = None
    # (ms, defuser)
    defuse: tuple[int, str] | None = None
    result: str = "Elimination"
    ceremony: str = "CeremonyDefault"
    red_loadout: int = 4000
    blue_loadout: int = 4000


def _player_ref(name: str) -> dict[str, Any]:
    return {"puuid": name.lower(), "name": name, "team": team_of(name)}


def make_match(
    rounds: list[RoundSpec], match_id: str = "m1", started_at: str = "2026-09-30T19:00:00Z", map_name: str = "Ascent"
) -> dict[str, Any]:
    kills, henrik_rounds = [], []
    for index, spec in enumerate(rounds):
        alive = set(RED + BLUE)
        damage: dict[str, list[dict[str, Any]]] = {}
        for kill in spec.kills:
            alive.discard(kill.victim)
            if team_of(kill.killer) != team_of(kill.victim):
                hit = {"player": _player_ref(kill.victim), "damage": 150, "headshots": 1, "bodyshots": 1, "legshots": 0}
                damage.setdefault(kill.killer, []).append(hit)
            kills.append(
                {
                    "round": index,
                    "time_in_round_in_ms": kill.ms,
                    "killer": _player_ref(kill.killer),
                    "victim": _player_ref(kill.victim),
                    "location": {"x": kill.x, "y": 0},
                    "assistants": [],
                    "weapon": {"name": kill.weapon, "type": kill.weapon_type},
                    "secondary_fire_mode": False,
                    "player_locations": [
                        {"player": _player_ref(p), "location": _position(kill, p), "view_radians": 0.0} for p in sorted(alive)
                    ],
                }
            )
        plant = None
        if spec.plant:
            ms, site, planter = spec.plant
            plant = {"round_time_in_ms": ms, "site": site, "player": _player_ref(planter), "location": {"x": -1000, "y": 0}}
        defuse = None
        if spec.defuse:
            ms, defuser = spec.defuse
            defuse = {"round_time_in_ms": ms, "player": _player_ref(defuser), "location": {"x": -1000, "y": 0}}
        henrik_rounds.append(
            {
                "id": index,
                "winning_team": spec.winner,
                "result": spec.result,
                "plant": plant,
                "defuse": defuse,
                "ceremony": spec.ceremony,
                "stats": [
                    {
                        "player": _player_ref(p),
                        "stats": {"score": 200 if damage.get(p) else 50, "headshots": 1, "bodyshots": 3, "legshots": 0},
                        "damage_events": damage.get(p, []),
                        "economy": {
                            "loadout_value": spec.red_loadout if team_of(p) == "Red" else spec.blue_loadout,
                            "remaining": 300,
                            "weapon": {"name": "Vandal"},
                            "armor": {"name": "Heavy Armor"},
                        },
                        "was_afk": False,
                        "received_penalty": False,
                    }
                    for p in RED + BLUE
                ],
            }
        )
    red_won = sum(r.winner == "Red" for r in rounds)
    return {
        "metadata": {
            "match_id": match_id,
            "started_at": started_at,
            "game_version": "release-13.05-shipping-1-1",
            "region": "eu",
            "map": {"name": map_name},
            "cluster": "Paris",
            "game_length_in_ms": 1_800_000,
        },
        "players": [
            {
                "puuid": p.lower(),
                "name": p,
                "team_id": team_of(p),
                "agent": {"name": "Jett"},
                "tier": {"id": 15, "name": "Platinum 1"},
                "stats": {"score": 4000},
                "ability_casts": {"grenade": 3, "ability1": 2},
            }
            for p in RED + BLUE
        ],
        "teams": [{"team_id": "Red", "won": red_won > len(rounds) - red_won}, {"team_id": "Blue", "won": red_won < len(rounds) - red_won}],
        "rounds": henrik_rounds,
        "kills": kills,
    }


def _position(kill: Kill, player: str) -> dict[str, float]:
    x, y = kill.positions.get(player, (kill.x, 100))
    return {"x": x, "y": y}


SQUAD = {p.lower() for p in RED}
