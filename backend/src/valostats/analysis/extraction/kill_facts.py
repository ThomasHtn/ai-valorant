"""Kill facts: one row per kill, with the weapon, both positions and the situation around it."""

from collections.abc import Iterable
from typing import Any

from valostats.analysis.extraction.cohorts import killer_cohort
from valostats.analysis.extraction.context import MatchContext
from valostats.analysis.extraction.geometry import distance, mean_spread, nearest
from valostats.analysis.extraction.henrik_payload import (
    is_enemy_hit,
    is_team,
    kill_means,
    location,
    opening_index,
    other_team,
    played_rounds,
    snapshot_location,
    weapon_name,
)
from valostats.analysis.extraction.revenge import revenge_pairs
from valostats.analysis.extraction.timeline import RoundTimeline, alive_before_kills, round_timelines
from valostats.domain.enums import Side
from valostats.domain.facts import KillFact


def extract_kills(contexts: Iterable[MatchContext]) -> list[KillFact]:
    """Every kill of every round, environment kills and teamkills included (flagged)."""
    facts: list[KillFact] = []
    for ctx in contexts:
        timelines = round_timelines(ctx.match)
        for rnd in played_rounds(ctx.match):
            damage = {s["player"]["puuid"]: _enemy_damage(s) for s in rnd["stats"]}
            facts.extend(_round_kills(ctx, rnd["id"], timelines[rnd["id"]], damage))
    return facts


def _enemy_damage(stats: dict[str, Any]) -> int:
    """Damage a player dealt to opponents in the round (Henrik also lists hits on teammates)."""
    return sum(e["damage"] for e in stats["damage_events"] if is_enemy_hit(e, stats["player"]["team"]))


def _round_kills(ctx: MatchContext, index: int, timeline: RoundTimeline, damage: dict[str, int]) -> list[KillFact]:
    kills = timeline.kills
    avenged = revenge_pairs(kills)
    plant_ms = next((s.ms for s in timeline.states if s.event and s.event.kind == "plant"), None)
    before = alive_before_kills(timeline)
    opening = opening_index(kills)
    facts = []
    for i, kill in enumerate(kills):
        victim_team, killer_team = kill["victim"]["team"], kill["killer"]["team"]
        # Environment kills come from an "Unknown" team: count the victim's opponents instead.
        acting_team = killer_team if is_team(killer_team) else other_team(victim_team)
        alive = before[id(kill)]
        avenger = kills[avenged[i]] if i in avenged else None
        victim_at = location(kill["location"])
        killer_at = snapshot_location(kill, kill["killer"]["puuid"])
        teammates = [location(q["location"]) for q in kill["player_locations"] if q["player"]["team"] == victim_team]
        facts.append(
            KillFact(
                **ctx.base,
                round_index=index,
                ms=kill["time_in_round_in_ms"],
                killer=kill["killer"]["name"],
                killer_puuid=kill["killer"]["puuid"],
                killer_team=killer_team,
                killer_cohort=killer_cohort(ctx.cohort_of, killer_team),
                victim=kill["victim"]["name"],
                victim_puuid=kill["victim"]["puuid"],
                victim_team=victim_team,
                victim_cohort=ctx.cohort_of(victim_team),
                victim_side=Side.ATTACK if victim_team == timeline.attacker else Side.DEFENSE,
                weapon=weapon_name(kill),
                means=kill_means(kill),
                secondary_fire=bool(kill.get("secondary_fire_mode")),
                assistants=tuple(a["name"] for a in kill.get("assistants") or []),
                victim_location=victim_at,
                killer_location=killer_at,
                victim_zone=ctx.game_map.callout_at(victim_at),
                killer_zone=ctx.game_map.callout_at(killer_at) if killer_at else None,
                distance=distance(killer_at, victim_at) if killer_at else None,
                nearest_teammate=nearest(victim_at, teammates),
                team_spread=mean_spread(teammates),
                opening=i == opening,
                avenged=avenger is not None,
                avenger=avenger["killer"]["name"] if avenger else None,
                avenge_ms=avenger["time_in_round_in_ms"] - kill["time_in_round_in_ms"] if avenger else None,
                victim_team_alive=alive[victim_team],
                killer_team_alive=alive[acting_team],
                post_plant=plant_ms is not None and kill["time_in_round_in_ms"] > plant_ms,
                victim_damage=damage.get(kill["victim"]["puuid"], 0),
                teamkill=victim_team == killer_team,
            )
        )
    return facts
