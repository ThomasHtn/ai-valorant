"""Lost rounds where the squad reached its highest chance of winning, with the story of how it slipped away."""

from collections.abc import Sequence
from dataclasses import dataclass

from valostats.analysis.extraction.henrik_payload import HenrikKill, HenrikMatch, match_id, other_team
from valostats.analysis.extraction.timeline import RoundTimeline, round_timelines
from valostats.analysis.extraction.win_probability import WinProbabilityTable
from valostats.analysis.session.narrative import DeathAfterPeak, PlantAfterPeak, clock, explain
from valostats.analysis.team.duel_maps import to_point
from valostats.constants.analysis import MAX_COSTLY_ROUNDS, THROW_MIN_WIN_CHANCE
from valostats.constants.game import REVENGE_WINDOW_MS
from valostats.constants.labels import BUY_LABELS
from valostats.domain.enums import BuyType, Cohort, Side
from valostats.domain.facts import Location, RoundFact
from valostats.domain.maps import GameMap
from valostats.schemas.session import CostlyRound, KillSnapshot, SnapshotPlayer, TimelineStep


@dataclass(frozen=True)
class _Peak:
    chance: float
    round_index: int
    side: Side
    state_index: int
    # The kill that cost the most win probability in the round.
    turning: HenrikKill | None
    timeline: RoundTimeline


def costly_rounds(
    match: HenrikMatch, squad_team: str, rounds: Sequence[RoundFact], table: WinProbabilityTable, game_map: GameMap
) -> list[CostlyRound]:
    """The lost rounds with the highest peak chance, if that chance was high enough."""
    peaks = [
        _peak(index, timeline, squad_team, table) for index, timeline in round_timelines(match).items() if timeline.winner != squad_team
    ]
    results = {r["id"]: r["result"] for r in match["rounds"]}
    squad_rounds = {r.round_index: r for r in rounds if r.match_id == match_id(match) and r.cohort is Cohort.SQUAD}
    return [
        _describe(peak, squad_team, squad_rounds[peak.round_index], results[peak.round_index], game_map)
        for peak in sorted(peaks, key=lambda p: -p.chance)[:MAX_COSTLY_ROUNDS]
        if peak.chance >= THROW_MIN_WIN_CHANCE
    ]


def _peak(index: int, timeline: RoundTimeline, squad_team: str, table: WinProbabilityTable) -> _Peak:
    other = other_team(squad_team)
    side = Side.ATTACK if timeline.attacker == squad_team else Side.DEFENSE
    best, best_index, drop, turning, previous = 0.0, 0, 0.0, None, None
    for i, state in enumerate(timeline.states):
        chance = table.probability(state.alive[squad_team], state.alive[other], side, state.planted)
        if chance > best:
            best, best_index = chance, i
        if previous is not None and state.event and state.event.kind == "kill" and previous - chance > drop:
            drop, turning = previous - chance, state.event.data
        previous = chance
    return _Peak(best, index, side, best_index, turning, timeline)


def _describe(peak: _Peak, squad_team: str, fact: RoundFact, ending: str, game_map: GameMap) -> CostlyRound:
    other = other_team(squad_team)
    timeline = peak.timeline
    at_peak = timeline.states[peak.state_index]
    kills = timeline.kills
    steps: list[TimelineStep] = []
    deaths: list[DeathAfterPeak] = []
    plant: PlantAfterPeak | None = None
    before = at_peak.alive
    for state in timeline.states[peak.state_index + 1 :]:
        assert state.event is not None
        data, after, ms = state.event.data, state.alive, state.ms
        state_after = f"{after[squad_team]}v{after[other]}"
        if state.event.kind == "plant":
            # The planter is always on attack, whatever team Henrik reports for them.
            ours = peak.side is Side.ATTACK
            plant = plant or PlantAfterPeak(
                ours, data["site"], clock(ms), f"{before[squad_team]}v{before[other]}", before[squad_team] - before[other]
            )
            steps.append(
                TimelineStep(
                    time_ms=ms,
                    kind="plant",
                    text=f"{'Vous plantez' if ours else 'Plant adverse'} sur {data['site']}",
                    state=state_after,
                    turning=False,
                )
            )
        elif data["victim"]["team"] == squad_team:
            spot = game_map.callout_at(Location(data["location"]["x"], data["location"]["y"]))
            revenge = any(
                k["victim"]["puuid"] == data["killer"]["puuid"] and 0 <= k["time_in_round_in_ms"] - ms <= REVENGE_WINDOW_MS for k in kills
            )
            deaths.append(
                DeathAfterPeak(
                    data["victim"]["name"], spot, ms, data["killer"]["name"], revenge, before[other] if before[squad_team] == 1 else 0
                )
            )
            text = f"{data['victim']['name']} meurt à {spot} face à {data['killer']['name']}{' · revenge' if revenge else ''}"
            steps.append(TimelineStep(time_ms=ms, kind="death", text=text, state=state_after, turning=data is peak.turning))
        else:
            spot = game_map.callout_at(Location(data["location"]["x"], data["location"]["y"]))
            text = f"{data['killer']['name']} tue {data['victim']['name']} à {spot}"
            steps.append(TimelineStep(time_ms=ms, kind="kill", text=text, state=state_after, turning=False))
        before = after

    headline, notes = explain(peak.side, plant, deaths, ending, at_peak.planted)
    buy = BUY_LABELS[BuyType.PISTOL] if fact.buy is BuyType.PISTOL else f"{BUY_LABELS[fact.buy]} vs {BUY_LABELS[fact.opp_buy]}"
    turning = peak.turning
    return CostlyRound(
        round_number=peak.round_index + 1,
        side=peak.side,
        buy=buy,
        best_chance=peak.chance,
        headline=headline,
        notes=notes,
        state=f"{at_peak.alive[squad_team]}v{at_peak.alive[other]}{', spike planté' if at_peak.planted else ''}",
        time_ms=at_peak.ms,
        steps=steps,
        turning_label=f"{turning['victim']['name']} à {game_map.callout_at(Location(turning['location']['x'], turning['location']['y']))}"
        if turning
        else None,
        snapshot=_snapshot(turning, squad_team, game_map) if turning else None,
    )


def _snapshot(kill: HenrikKill, squad_team: str, game_map: GameMap) -> KillSnapshot:
    positions = {p["player"]["puuid"]: p for p in kill["player_locations"]}
    killer = positions.get(kill["killer"]["puuid"])
    return KillSnapshot(
        map_name=game_map.name,
        minimap_url=game_map.minimap_url,
        victim=to_point(game_map, Location(kill["location"]["x"], kill["location"]["y"])),
        victim_squad=kill["victim"]["team"] == squad_team,
        killer=to_point(game_map, Location(killer["location"]["x"], killer["location"]["y"])) if killer else None,
        players=[
            SnapshotPlayer(
                name=p["player"]["name"],
                squad=p["player"]["team"] == squad_team,
                position=to_point(game_map, Location(p["location"]["x"], p["location"]["y"])),
            )
            for p in positions.values()
        ],
    )
