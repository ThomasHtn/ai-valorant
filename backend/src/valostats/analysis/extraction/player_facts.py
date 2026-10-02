"""Player facts: one row per player and round, one row per player and match."""

from collections import defaultdict
from collections.abc import Collection, Iterable, Mapping
from dataclasses import dataclass
from typing import Any

from valostats.analysis.extraction.cohorts import cohort_labeler
from valostats.analysis.extraction.henrik_payload import (
    HenrikKill,
    HenrikMatch,
    is_team,
    map_name,
    match_id,
    other_team,
    patch,
    started_at,
)
from valostats.analysis.extraction.timeline import RoundTimeline, round_timelines
from valostats.analysis.extraction.win_probability import WinProbabilityTable
from valostats.constants.game import BLUE, RED, REVENGE_WINDOW_MS, TEAMS
from valostats.domain.enums import Side
from valostats.domain.facts import Location, PlayerMatchFact, PlayerRoundFact
from valostats.domain.maps import GameMap


@dataclass(frozen=True, slots=True)
class PlayerExtraction:
    rounds: list[PlayerRoundFact]
    matches: list[PlayerMatchFact]


def extract_players(
    matches: Iterable[HenrikMatch],
    maps: Mapping[str, GameMap],
    win_probability: WinProbabilityTable,
    squad: Collection[str] | None,
) -> PlayerExtraction:
    """Combat, opening duels, revenge, clutch and impact of every player; same filters as `extract_rounds`."""
    rounds: list[PlayerRoundFact] = []
    per_match: list[PlayerMatchFact] = []
    for match in matches:
        game_map = maps.get(map_name(match))
        cohort_of = cohort_labeler(match, squad)
        if game_map is None or cohort_of is None:
            continue
        base: dict[str, Any] = {
            "match_id": match_id(match),
            "started_at": started_at(match),
            "patch": patch(match),
            "map_name": game_map.name,
        }
        players = {p["puuid"]: p for p in match["players"]}
        team_won = {t["team_id"]: t["won"] for t in match["teams"]}

        for p in match["players"]:
            casts = p.get("ability_casts") or {}
            per_match.append(
                PlayerMatchFact(
                    **base,
                    cohort=cohort_of(p["team_id"]),
                    team_id=p["team_id"],
                    puuid=p["puuid"],
                    name=p["name"],
                    agent=p["agent"]["name"],
                    rounds=len(match["rounds"]),
                    won=team_won.get(p["team_id"], False),
                    grenade_casts=casts.get("grenade") or 0,
                    ability1_casts=casts.get("ability1") or 0,
                    ability2_casts=casts.get("ability2") or 0,
                    ultimate_casts=casts.get("ultimate") or 0,
                )
            )

        for index, timeline in round_timelines(match).items():
            rnd = match["rounds"][index]
            kills = timeline.kills
            avenged, revenge_kills = _revenges(kills)
            impact, clutch = _impact_and_clutches(timeline, win_probability)
            first = kills[0] if kills and kills[0]["killer"]["team"] != kills[0]["victim"]["team"] else None

            for stats in rnd["stats"]:
                puuid, team = stats["player"]["puuid"], stats["player"]["team"]
                if puuid not in players:
                    continue
                own_kills = [i for i, k in enumerate(kills) if k["killer"]["puuid"] == puuid and k["victim"]["team"] != team]
                own_deaths = [i for i, k in enumerate(kills) if k["victim"]["puuid"] == puuid]
                assists = sum(any(a["puuid"] == puuid for a in (k.get("assistants") or [])) for k in kills if k["victim"]["team"] != team)
                traded = any(i in avenged for i in own_deaths)
                damage = sum(e["damage"] for e in stats["damage_events"])
                first_blood = bool(first and first["killer"]["puuid"] == puuid)
                first_death = bool(first and first["victim"]["puuid"] == puuid)
                fb_location = _killer_location(first, puuid) if first_blood else None
                fd_location = Location(first["location"]["x"], first["location"]["y"]) if first and first_death else None
                clutch_versus = clutch[team][1] if team in clutch and clutch[team][0] == puuid else 0
                death_location = kills[own_deaths[0]]["location"] if own_deaths else None
                counters = stats["stats"]
                rounds.append(
                    PlayerRoundFact(
                        **base,
                        round_index=index,
                        cohort=cohort_of(team),
                        side=Side.ATTACK if team == timeline.attacker else Side.DEFENSE,
                        puuid=puuid,
                        name=stats["player"]["name"],
                        agent=players[puuid]["agent"]["name"],
                        won=rnd["winning_team"] == team,
                        match_won=team_won.get(team, False),
                        kills=len(own_kills),
                        deaths=len(own_deaths),
                        assists=assists,
                        score=counters["score"],
                        damage=damage,
                        headshots=counters["headshots"],
                        bodyshots=counters["bodyshots"],
                        legshots=counters["legshots"],
                        survived=not own_deaths,
                        traded=traded,
                        kast=bool(own_kills or assists or not own_deaths or traded),
                        revenge_given=sum(i in revenge_kills for i in own_kills),
                        first_blood=first_blood,
                        first_death=first_death,
                        first_blood_location=fb_location,
                        first_death_location=fd_location,
                        clutch_versus=clutch_versus,
                        clutch_won=bool(clutch_versus) and rnd["winning_team"] == team,
                        win_probability_added=impact[puuid],
                        death_ms=kills[own_deaths[0]]["time_in_round_in_ms"] if own_deaths else None,
                        zero_damage_death=bool(own_deaths) and damage == 0,
                        weapon=(stats["economy"].get("weapon") or {}).get("name"),
                        death_callout=game_map.callout_at(Location(death_location["x"], death_location["y"])) if death_location else None,
                    )
                )
    return PlayerExtraction(rounds, per_match)


def _revenges(kills: list[HenrikKill]) -> tuple[set[int], set[int]]:
    """Indexes of the kills that were avenged within the window, and of the kills that avenged them."""
    avenged, revenge_kills = set(), set()
    for i, kill in enumerate(kills):
        for j in range(i + 1, len(kills)):
            later = kills[j]
            if (
                later["victim"]["puuid"] == kill["killer"]["puuid"]
                and later["killer"]["team"] == kill["victim"]["team"]
                and 0 <= later["time_in_round_in_ms"] - kill["time_in_round_in_ms"] <= REVENGE_WINDOW_MS
            ):
                avenged.add(i)
                revenge_kills.add(j)
    return avenged, revenge_kills


def _impact_and_clutches(
    timeline: RoundTimeline, table: WinProbabilityTable
) -> tuple[defaultdict[str, float], dict[str, tuple[str | None, int]]]:
    """Win probability added per player, and per team the player left alone with the number of opponents.

    Each kill or plant moves the team's chance of winning; the swing is credited to the killer or
    planter and charged to the victim.
    """
    impact: defaultdict[str, float] = defaultdict(float)
    clutch: dict[str, tuple[str | None, int]] = {}
    previous = timeline.states[0]
    for state in timeline.states[1:]:
        event = state.event
        assert event is not None
        data = event.data
        # The planter is always on attack; Henrik sometimes reports its team as "Unknown".
        actor = timeline.attacker if event.kind == "plant" else data["killer"]["team"]
        if not is_team(actor):
            # Environmental death (spike, fall): the swing goes against the victim's team, no killer credit.
            actor = BLUE if data["victim"]["team"] == RED else RED
        other = other_team(actor)
        side = Side.ATTACK if actor == timeline.attacker else Side.DEFENSE
        before = table.probability(previous.alive[actor], previous.alive[other], side, previous.planted)
        after = table.probability(state.alive[actor], state.alive[other], side, state.planted)
        if event.kind == "plant":
            planter = (data.get("player") or {}).get("puuid")
            if planter:
                impact[planter] += after - before
        elif actor != data["victim"]["team"]:
            if data["killer"]["team"] == actor:
                impact[data["killer"]["puuid"]] += after - before
            impact[data["victim"]["puuid"]] -= after - before
            for team in TEAMS:
                if state.alive[team] == 1 and state.alive[other_team(team)] >= 1 and team not in clutch:
                    last = next((q["player"]["puuid"] for q in data["player_locations"] if q["player"]["team"] == team), None)
                    clutch[team] = (last, state.alive[other_team(team)])
        previous = state
    return impact, clutch


def _killer_location(kill: HenrikKill | None, puuid: str) -> Location | None:
    """Where the killer stood, read from the kill snapshot."""
    if kill is None:
        return None
    spot = next((q["location"] for q in kill["player_locations"] if q["player"]["puuid"] == puuid), None)
    return Location(spot["x"], spot["y"]) if spot else None
