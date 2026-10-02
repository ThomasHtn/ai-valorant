"""Round and death facts of every team in a list of matches."""

from collections.abc import Collection, Iterable, Mapping
from dataclasses import dataclass
from typing import Any

from valostats.analysis.extraction.cohorts import cohort_labeler, killer_cohort
from valostats.analysis.extraction.economy import buy_type
from valostats.analysis.extraction.henrik_payload import (
    HenrikMatch,
    map_name,
    match_id,
    other_team,
    patch,
    started_at,
)
from valostats.analysis.extraction.timeline import round_timelines
from valostats.constants.game import REVENGE_WINDOW_MS, TEAM_SIZE, TEAMS
from valostats.domain.enums import Side
from valostats.domain.facts import DeathFact, Location, RoundFact
from valostats.domain.maps import GameMap


@dataclass(frozen=True, slots=True)
class RoundExtraction:
    rounds: list[RoundFact]
    deaths: list[DeathFact]


def extract_rounds(matches: Iterable[HenrikMatch], maps: Mapping[str, GameMap], squad: Collection[str] | None) -> RoundExtraction:
    """Team-round and death facts of both teams.

    With a squad, only its 5-stacks are kept and teams are labelled squad / opponents; without one
    (top ranked matches) every team is labelled top. Matches on maps without callouts are skipped.
    """
    rounds: list[RoundFact] = []
    deaths: list[DeathFact] = []
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
        timelines = round_timelines(match)
        for rnd in match["rounds"]:
            index = rnd["id"]
            timeline = timelines[index]
            kills = timeline.kills
            plant_ms = rnd["plant"]["round_time_in_ms"] if rnd["plant"] else None
            damage = {s["player"]["puuid"]: sum(e["damage"] for e in s["damage_events"]) for s in rnd["stats"]}

            max_adv = dict.fromkeys(TEAMS, 0)
            min_adv = dict.fromkeys(TEAMS, 0)
            visited: dict[str, set[str]] = {team: set() for team in TEAMS}
            alive_at_plant = None
            for state in timeline.states:
                for team in TEAMS:
                    own, opp = state.alive[team], state.alive[other_team(team)]
                    max_adv[team] = max(max_adv[team], own - opp)
                    min_adv[team] = min(min_adv[team], own - opp)
                    if own and opp:
                        visited[team].add(f"{own}v{opp}")
                if state.event and state.event.kind == "plant":
                    alive_at_plant = state.alive

            for i, kill in enumerate(kills):
                victim_team, killer_team = kill["victim"]["team"], kill["killer"]["team"]
                avenger = next(
                    (
                        later["killer"]["name"]
                        for later in kills[i + 1 :]
                        if later["victim"]["puuid"] == kill["killer"]["puuid"]
                        and later["killer"]["team"] == victim_team
                        and 0 <= later["time_in_round_in_ms"] - kill["time_in_round_in_ms"] <= REVENGE_WINDOW_MS
                    ),
                    None,
                )
                location = Location(kill["location"]["x"], kill["location"]["y"])
                deaths.append(
                    DeathFact(
                        **base,
                        round_index=index,
                        cohort=cohort_of(victim_team),
                        team_id=victim_team,
                        name=kill["victim"]["name"],
                        side=Side.ATTACK if victim_team == timeline.attacker else Side.DEFENSE,
                        ms=kill["time_in_round_in_ms"],
                        opening=i == 0,
                        traded=avenger is not None,
                        avenger=avenger,
                        callout=game_map.callout_at(location),
                        damage=damage.get(kill["victim"]["puuid"], 0),
                        post_plant=plant_ms is not None and kill["time_in_round_in_ms"] > plant_ms,
                        killer=kill["killer"]["name"],
                        killer_cohort=killer_cohort(cohort_of, killer_team),
                        teamkill=victim_team == killer_team,
                    )
                )

            for team in TEAMS:
                other = other_team(team)
                loadouts = [s["economy"]["loadout_value"] for s in rnd["stats"] if s["player"]["team"] == team]
                opp_loadouts = [s["economy"]["loadout_value"] for s in rnd["stats"] if s["player"]["team"] == other]
                if len(loadouts) < TEAM_SIZE or len(opp_loadouts) < TEAM_SIZE:
                    continue
                rounds.append(
                    RoundFact(
                        **base,
                        round_index=index,
                        cohort=cohort_of(team),
                        team_id=team,
                        side=Side.ATTACK if team == timeline.attacker else Side.DEFENSE,
                        won=rnd["winning_team"] == team,
                        first_kill=kills[0]["killer"]["team"] == team if kills else None,
                        buy=buy_type(index, loadouts),
                        opp_buy=buy_type(index, opp_loadouts),
                        max_advantage=max_adv[team],
                        min_advantage=min_adv[team],
                        planted=plant_ms is not None,
                        plant_site=rnd["plant"]["site"] if rnd["plant"] else None,
                        advantage_at_plant=None if alive_at_plant is None else alive_at_plant[team] - alive_at_plant[other],
                        states=tuple(sorted(visited[team])),
                        result=rnd["result"],
                        first_kill_ms=kills[0]["time_in_round_in_ms"] if kills else None,
                        plant_ms=plant_ms,
                        loadout=sum(loadouts) / TEAM_SIZE,
                        opp_loadout=sum(opp_loadouts) / TEAM_SIZE,
                    )
                )
    return RoundExtraction(rounds, deaths)
