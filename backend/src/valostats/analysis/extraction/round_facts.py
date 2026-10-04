"""Round facts: one row per team and round."""

from collections.abc import Iterable
from typing import Any

from valostats.analysis.extraction.context import MatchContext
from valostats.analysis.extraction.economy import buy_type
from valostats.analysis.extraction.henrik_payload import location, opening_index, other_team, played_rounds
from valostats.analysis.extraction.revenge import revenge_pairs
from valostats.analysis.extraction.round_context import RoundContext, round_contexts
from valostats.analysis.extraction.timeline import RoundTimeline, round_timelines
from valostats.constants.game import TEAM_SIZE, TEAMS
from valostats.domain.enums import Side
from valostats.domain.facts import RoundFact


def extract_rounds(contexts: Iterable[MatchContext]) -> list[RoundFact]:
    """Both teams of every round. Rounds where a team has fewer than five players are skipped (leaver)."""
    facts: list[RoundFact] = []
    for ctx in contexts:
        timelines = round_timelines(ctx.match)
        contexts_by_round = round_contexts(ctx.match)
        team_won = {t["team_id"]: t["won"] for t in ctx.match["teams"]}
        for rnd in played_rounds(ctx.match):
            loadouts = {team: [s["economy"]["loadout_value"] or 0 for s in rnd["stats"] if s["player"]["team"] == team] for team in TEAMS}
            if any(len(values) < TEAM_SIZE for values in loadouts.values()):
                continue
            timeline = timelines[rnd["id"]]
            for team in TEAMS:
                facts.append(
                    _round_fact(ctx, rnd, timeline, team, loadouts, contexts_by_round[(rnd["id"], team)], team_won.get(team, False))
                )
    return facts


def _round_fact(
    ctx: MatchContext,
    rnd: dict[str, Any],
    timeline: RoundTimeline,
    team: str,
    loadouts: dict[str, list[int]],
    context: RoundContext,
    match_won: bool,
) -> RoundFact:
    index, other = rnd["id"], other_team(team)
    kills = timeline.kills
    plant, defuse = rnd.get("plant"), rnd.get("defuse")
    side = Side.ATTACK if team == timeline.attacker else Side.DEFENSE
    won = rnd["winning_team"] == team
    advantages = [state.alive[team] - state.alive[other] for state in timeline.states]
    at_plant = next((s.alive for s in timeline.states if s.event and s.event.kind == "plant"), None)
    end = timeline.states[-1].alive
    # The opening duel: a fall or a teamkill before it is not a first kill.
    opening = opening_index(kills)
    first = kills[opening] if opening is not None else None
    first_death_avenged = opening in revenge_pairs(kills) if first and first["victim"]["team"] == team else None
    event_times = [k["time_in_round_in_ms"] for k in kills] + [e["round_time_in_ms"] for e in (plant, defuse) if e]
    return RoundFact(
        **ctx.base,
        round_index=index,
        cohort=ctx.cohort_of(team),
        team_id=team,
        side=side,
        won=won,
        first_kill=first["killer"]["team"] == team if first else None,
        first_death_avenged=first_death_avenged,
        buy=buy_type(index, loadouts[team]),
        opp_buy=buy_type(index, loadouts[other]),
        max_advantage=max(advantages),
        min_advantage=min(advantages),
        planted=plant is not None,
        plant_site=plant["site"] if plant else None,
        advantage_at_plant=None if at_plant is None else at_plant[team] - at_plant[other],
        plant_location=location(plant["location"]) if plant and plant.get("location") else None,
        planter=(plant.get("player") or {}).get("name") if plant else None,
        defused=defuse is not None,
        defuser=(defuse.get("player") or {}).get("name") if defuse else None,
        states=tuple(sorted({f"{s.alive[team]}v{s.alive[other]}" for s in timeline.states if s.alive[team] and s.alive[other]})),
        result=rnd["result"],
        ceremony=rnd.get("ceremony"),
        # Attack lost without a plant while attackers were still alive: the clock ran out.
        timeout=side is Side.ATTACK and not won and plant is None and end[team] > 0,
        first_kill_ms=first["time_in_round_in_ms"] if first else None,
        plant_ms=plant["round_time_in_ms"] if plant else None,
        last_event_ms=max(event_times, default=0),
        loadout=sum(loadouts[team]) / TEAM_SIZE,
        opp_loadout=sum(loadouts[other]) / TEAM_SIZE,
        alive_end=end[team],
        opp_alive_end=end[other],
        score_diff=context.score_diff,
        previous_won=context.previous_won,
        previous_losses=context.previous_losses,
        pistol_won=context.pistol_won,
        second_round_won=context.second_round_won,
        match_won=match_won,
    )
