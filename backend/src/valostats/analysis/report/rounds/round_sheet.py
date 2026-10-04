"""Sheet of one round, rebuilt from the raw Henrik payload of its match.

The facts tables do not keep every player's position at every event, so the 2D replay and the
event texts are read from the payload, which is loaded only when a sheet is opened.
"""

from collections.abc import Callable, Mapping
from dataclasses import dataclass
from typing import Any

from valostats.analysis.extraction.henrik_payload import HenrikKill, HenrikMatch, alive_after, location, other_team, weapon_name
from valostats.analysis.extraction.revenge import revenge_pairs
from valostats.analysis.extraction.win_probability import WinProbabilityTable
from valostats.constants.game import TEAM_SIZE
from valostats.constants.rounds import MINIMAP_DECIMALS, PROBABILITY_DECIMALS
from valostats.domain.maps import GameMap
from valostats.schemas.report.rounds import EconomyLine, EventKind, PlayerPosition, RoundEvent, RoundLine, RoundSheet

# Shown instead of a weapon name for kills made with an ability (Henrik leaves some unnamed).
_ABILITY_LABEL = "capacité"

# On equal times, a kill comes before the plant and the plant before the defuse.
_EVENT_ORDER = {EventKind.KILL: 0, EventKind.PLANT: 1, EventKind.DEFUSE: 2}


@dataclass(frozen=True, slots=True)
class _RawEvent:
    kind: EventKind
    ms: int
    data: dict[str, Any]


def round_sheet(
    match: HenrikMatch,
    line: RoundLine,
    squad_team: str,
    game_map: GameMap,
    table: WinProbabilityTable,
) -> RoundSheet:
    """Timeline, positions and economy of the round described by `line` (a squad round of `match`)."""
    index = line.round_number - 1
    rnd = next(r for r in match["rounds"] if r["id"] == index)
    kills = sorted((k for k in match["kills"] if k["round"] == index), key=lambda k: k["time_in_round_in_ms"])
    agents = {p["puuid"]: p["agent"]["name"] for p in match["players"]}
    return RoundSheet(
        round=line,
        events=_events(rnd, kills, line, squad_team, game_map, table),
        rotation=game_map.attack_up_rotation(),
        squad_economy=_economy(rnd, agents, lambda team: team == squad_team),
        opp_economy=_economy(rnd, agents, lambda team: team != squad_team),
    )


def _events(
    rnd: dict[str, Any],
    kills: list[HenrikKill],
    line: RoundLine,
    squad_team: str,
    game_map: GameMap,
    table: WinProbabilityTable,
) -> list[RoundEvent]:
    raw = [_RawEvent(EventKind.KILL, k["time_in_round_in_ms"], k) for k in kills]
    if rnd.get("plant"):
        raw.append(_RawEvent(EventKind.PLANT, rnd["plant"]["round_time_in_ms"], rnd["plant"]))
    if rnd.get("defuse"):
        raw.append(_RawEvent(EventKind.DEFUSE, rnd["defuse"].get("round_time_in_ms") or 0, rnd["defuse"]))
    raw.sort(key=lambda e: (e.ms, _EVENT_ORDER[e.kind]))

    opp_team = other_team(squad_team)
    avenged = revenge_pairs(kills)
    kill_index = {id(k): i for i, k in enumerate(kills)}
    alive = {squad_team: TEAM_SIZE, opp_team: TEAM_SIZE}
    planted = False
    events = []
    for event in raw:
        data = event.data
        zone: str | None
        positions = _positions(data.get("player_locations") or [], squad_team, game_map)
        if event.kind is EventKind.KILL:
            alive = {team: n for team, n in alive_after(data).items() if team in alive}
            victim_at = game_map.to_minimap(location(data["location"]))
            positions.append(_position(data["victim"]["name"], data["victim"]["team"] == squad_team, victim_at, alive=False))
            i = kill_index[id(data)]
            avenger = kills[avenged[i]] if i in avenged else None
            zone = game_map.callout_at(location(data["location"]))
            weapon = weapon_name(data)
            text = f"{data['killer']['name']} tue {data['victim']['name']} à {zone} ({weapon or _ABILITY_LABEL})"
            if avenger:
                text += f", revenge par {avenger['killer']['name']} à {_clock(avenger['time_in_round_in_ms'])}"
            actor, target, actor_team = data["killer"]["name"], data["victim"]["name"], data["killer"]["team"]
        else:
            planted = planted or event.kind is EventKind.PLANT
            actor, target, weapon, actor_team = data["player"]["name"], None, None, data["player"]["team"]
            zone = data.get("site") if event.kind is EventKind.PLANT else None
            text = f"{actor} plante le spike en {zone}" if event.kind is EventKind.PLANT else f"{actor} désamorce le spike"
        probability = table.probability(alive[squad_team], alive[opp_team], line.side, planted)
        if event.kind is EventKind.DEFUSE:
            # A defuse ends the round: the defusing team wins.
            probability = 1.0 if actor_team == squad_team else 0.0
        events.append(
            RoundEvent(
                ms=event.ms,
                kind=event.kind,
                text=text,
                actor=actor,
                target=target,
                weapon=weapon,
                zone=zone,
                squad_actor=actor_team == squad_team,
                own_alive=alive[squad_team],
                opp_alive=alive[opp_team],
                win_probability=round(probability, PROBABILITY_DECIMALS),
                positions=positions,
            )
        )
    return events


def _positions(snapshot: list[dict[str, Any]], squad_team: str, game_map: GameMap) -> list[PlayerPosition]:
    """Players of an event snapshot: Henrik lists the players alive at that moment."""
    return [
        _position(p["player"]["name"], p["player"]["team"] == squad_team, game_map.to_minimap(location(p["location"])), alive=True)
        for p in snapshot
    ]


def _position(name: str, squad: bool, point: tuple[float, float], alive: bool) -> PlayerPosition:
    return PlayerPosition(name=name, squad=squad, x=round(point[0], MINIMAP_DECIMALS), y=round(point[1], MINIMAP_DECIMALS), alive=alive)


def _economy(rnd: dict[str, Any], agents: Mapping[str, str], keep: Callable[[str], bool]) -> list[EconomyLine]:
    """Buy of each player of one team at the end of the buy phase, alphabetical."""
    lines = [
        EconomyLine(
            name=s["player"]["name"],
            agent=agents.get(s["player"]["puuid"], ""),
            loadout=s["economy"].get("loadout_value") or 0,
            weapon=(s["economy"].get("weapon") or {}).get("name"),
            armor=(s["economy"].get("armor") or {}).get("name"),
            remaining=s["economy"].get("remaining") or 0,
        )
        for s in rnd["stats"]
        if keep(s["player"]["team"])
    ]
    return sorted(lines, key=lambda line: line.name.lower())


def _clock(ms: int) -> str:
    """Time since the start of the round, e.g. 0:41."""
    seconds = round(ms / 1000)
    return f"{seconds // 60}:{seconds % 60:02d}"
