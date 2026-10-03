"""Player facts: one row per player and round, one row per player and match."""

from collections import defaultdict
from collections.abc import Iterable
from dataclasses import dataclass
from typing import Any

from valostats.analysis.extraction.context import MatchContext
from valostats.analysis.extraction.henrik_payload import HenrikKill, is_team, location, other_team, snapshot_location, tier
from valostats.analysis.extraction.revenge import revenge_pairs
from valostats.analysis.extraction.timeline import RoundTimeline, alive_before_kills, round_timelines
from valostats.analysis.extraction.win_probability import WinProbabilityTable
from valostats.constants.game import BLUE, RED, TEAMS
from valostats.domain.enums import Side
from valostats.domain.facts import PlayerMatchFact, PlayerRoundFact


@dataclass(frozen=True, slots=True)
class PlayerExtraction:
    rounds: list[PlayerRoundFact]
    matches: list[PlayerMatchFact]


@dataclass(frozen=True, slots=True)
class _Received:
    """Damage and hits a player took in a round, summed over the opponents' damage events."""

    damage: int = 0
    headshots: int = 0
    bodyshots: int = 0
    legshots: int = 0


def extract_players(contexts: Iterable[MatchContext], win_probability: WinProbabilityTable) -> PlayerExtraction:
    """Combat, economy, opening duels, revenge, clutch and impact of every player."""
    rounds: list[PlayerRoundFact] = []
    matches: list[PlayerMatchFact] = []
    for ctx in contexts:
        matches.extend(_player_matches(ctx))
        players = {p["puuid"]: p for p in ctx.match["players"]}
        team_won = {t["team_id"]: t["won"] for t in ctx.match["teams"]}
        for index, timeline in round_timelines(ctx.match).items():
            rnd = ctx.match["rounds"][index]
            rounds.extend(_round_players(ctx, rnd, timeline, players, team_won, win_probability))
    return PlayerExtraction(rounds, matches)


def _player_matches(ctx: MatchContext) -> list[PlayerMatchFact]:
    team_won = {t["team_id"]: t["won"] for t in ctx.match["teams"]}
    facts = []
    for p in ctx.match["players"]:
        casts = p.get("ability_casts") or {}
        tier_id, tier_name = tier(p)
        facts.append(
            PlayerMatchFact(
                **ctx.base,
                cohort=ctx.cohort_of(p["team_id"]),
                team_id=p["team_id"],
                puuid=p["puuid"],
                name=p["name"],
                agent=p["agent"]["name"],
                rounds=len(ctx.match["rounds"]),
                won=team_won.get(p["team_id"], False),
                score=(p.get("stats") or {}).get("score") or 0,
                tier_id=tier_id,
                tier_name=tier_name,
                grenade_casts=casts.get("grenade") or 0,
                ability1_casts=casts.get("ability1") or 0,
                ability2_casts=casts.get("ability2") or 0,
                ultimate_casts=casts.get("ultimate") or 0,
            )
        )
    return facts


def _round_players(
    ctx: MatchContext,
    rnd: dict[str, Any],
    timeline: RoundTimeline,
    players: dict[str, Any],
    team_won: dict[str, bool],
    win_probability: WinProbabilityTable,
) -> list[PlayerRoundFact]:
    kills = timeline.kills
    avenged = revenge_pairs(kills)
    revenge_kills = set(avenged.values())
    impact, clutch = _impact_and_clutches(timeline, win_probability)
    received = _received(rnd)
    alive_before = alive_before_kills(timeline)
    first = kills[0] if kills and kills[0]["killer"]["team"] != kills[0]["victim"]["team"] else None
    facts = []
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
        clutch_versus = clutch[team][1] if team in clutch and clutch[team][0] == puuid else 0
        death = kills[own_deaths[0]] if own_deaths else None
        kill_times = [kills[i]["time_in_round_in_ms"] for i in own_kills]
        counters, economy = stats["stats"], stats.get("economy") or {}
        hits = received.get(puuid, _Received())
        facts.append(
            PlayerRoundFact(
                **ctx.base,
                round_index=rnd["id"],
                cohort=ctx.cohort_of(team),
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
                damage_received=hits.damage,
                headshots=counters["headshots"],
                bodyshots=counters["bodyshots"],
                legshots=counters["legshots"],
                headshots_received=hits.headshots,
                bodyshots_received=hits.bodyshots,
                legshots_received=hits.legshots,
                survived=not own_deaths,
                traded=traded,
                kast=bool(own_kills or assists or not own_deaths or traded),
                revenge_given=sum(i in revenge_kills for i in own_kills),
                first_blood=first_blood,
                first_death=first_death,
                first_blood_location=snapshot_location(first, puuid) if first and first_blood else None,
                first_death_location=location(first["location"]) if first and first_death else None,
                clutch_versus=clutch_versus,
                clutch_won=bool(clutch_versus) and rnd["winning_team"] == team,
                win_probability_added=impact[puuid],
                death_ms=death["time_in_round_in_ms"] if death else None,
                zero_damage_death=death is not None and damage == 0,
                kills_outnumbered=sum(alive_before[id(kills[i])][team] < alive_before[id(kills[i])][other_team(team)] for i in own_kills),
                multikill_span_ms=kill_times[-1] - kill_times[0] if len(kill_times) >= 2 else None,
                weapon=(economy.get("weapon") or {}).get("name"),
                armor=(economy.get("armor") or {}).get("name"),
                loadout=economy.get("loadout_value") or 0,
                remaining=economy.get("remaining") or 0,
                death_callout=ctx.game_map.callout_at(location(death["location"])) if death else None,
                afk=bool(stats.get("was_afk")),
                penalty=bool(stats.get("received_penalty")),
            )
        )
    return facts


def _received(rnd: dict[str, Any]) -> dict[str, _Received]:
    """Damage and hits taken per player, from every player's damage events (they name their target)."""
    totals: defaultdict[str, list[int]] = defaultdict(lambda: [0, 0, 0, 0])
    for stats in rnd["stats"]:
        for event in stats["damage_events"]:
            target = (event.get("player") or {}).get("puuid")
            if target:
                total = totals[target]
                total[0] += event["damage"]
                total[1] += event.get("headshots") or 0
                total[2] += event.get("bodyshots") or 0
                total[3] += event.get("legshots") or 0
    return {puuid: _Received(*values) for puuid, values in totals.items()}


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
        data: HenrikKill = event.data
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
