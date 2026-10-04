import pytest

from tests.factories import SQUAD, TEST_MAP, Kill, RoundSpec, make_match
from valostats.analysis.extraction.context import MatchContext, matches_to_extract
from valostats.analysis.extraction.economy import buy_type
from valostats.analysis.extraction.henrik_payload import HenrikMatch, attacker
from valostats.analysis.extraction.kill_facts import extract_kills
from valostats.analysis.extraction.match_facts import extract_matches
from valostats.analysis.extraction.player_facts import extract_players
from valostats.analysis.extraction.round_facts import extract_rounds
from valostats.analysis.extraction.timeline import round_timelines
from valostats.analysis.extraction.win_probability import WinProbabilityTable
from valostats.domain.enums import BuyType, Cohort, KillerCohort, KillMeans, Side
from valostats.domain.facts import PlayerRoundFact, RoundFact

MAPS = {TEST_MAP.name: TEST_MAP}


def contexts(*matches: HenrikMatch) -> list[MatchContext]:
    return list(matches_to_extract(matches, MAPS, SQUAD))


def squad_rounds(match: HenrikMatch) -> list[RoundFact]:
    return [r for r in extract_rounds(contexts(match)) if r.cohort is Cohort.SQUAD]


def players(match: HenrikMatch) -> dict[str, PlayerRoundFact]:
    table = WinProbabilityTable.from_matches([match])
    return {p.name: p for p in extract_players(contexts(match), table).rounds}


def test_red_attacks_first_half_then_sides_swap_every_overtime_round():
    assert [attacker(i) for i in (0, 11, 12, 23, 24, 25)] == ["Red", "Red", "Blue", "Blue", "Red", "Blue"]


def test_buy_type_uses_pistol_rounds_and_average_loadout():
    assert buy_type(0, [800] * 5) is BuyType.PISTOL
    assert buy_type(12, [5000] * 5) is BuyType.PISTOL
    assert buy_type(3, [4000] * 5) is BuyType.FULL
    assert buy_type(3, [2000] * 5) is BuyType.FORCE
    assert buy_type(3, [1000] * 5) is BuyType.ECO


def test_timeline_puts_the_plant_after_a_kill_at_the_same_time():
    match = make_match([RoundSpec("Red", [Kill(5000, "R1", "B1")], plant=(5000, "A", "R2"))])
    states = round_timelines(match)[0].states
    assert [s.event.kind for s in states[1:] if s.event] == ["kill", "plant"]
    assert states[1].alive == {"Red": 5, "Blue": 4}
    assert states[2].planted


def test_squad_rounds_are_labelled_and_opponent_rounds_mirror_them():
    match = make_match([RoundSpec("Red", [Kill(3000, "R1", "B1"), Kill(4000, "R2", "B2")])])
    rounds = extract_rounds(contexts(match))
    squad = next(r for r in rounds if r.cohort is Cohort.SQUAD)
    opponents = next(r for r in rounds if r.cohort is Cohort.OPPONENT)
    assert (squad.side, squad.won, squad.first_kill, squad.max_advantage) == (Side.ATTACK, True, True, 2)
    assert (opponents.side, opponents.won, opponents.first_kill, opponents.min_advantage) == (Side.DEFENSE, False, False, -2)
    assert "5v4" in squad.states and "5v3" in squad.states
    assert (squad.alive_end, squad.opp_alive_end, squad.last_event_ms) == (5, 3, 4000)


def test_match_without_a_five_stack_is_skipped():
    match = make_match([RoundSpec("Red")])
    assert list(matches_to_extract([match], MAPS, {"r1", "r2"})) == []


def test_death_is_avenged_when_a_teammate_kills_the_killer_within_three_seconds():
    kills = [Kill(10_000, "B1", "R1"), Kill(12_000, "R2", "B1"), Kill(20_000, "B2", "R3"), Kill(24_000, "R4", "B2")]
    facts = extract_kills(contexts(make_match([RoundSpec("Red", kills)])))
    r1, b1, r3, _ = facts
    assert (r1.avenged, r1.avenger, r1.avenge_ms, r1.opening, r1.killer_cohort) == (True, "R2", 2000, True, KillerCohort.OPPONENT)
    assert not b1.avenged
    # Four seconds is too late for a revenge.
    assert not r3.avenged
    assert r1.victim_zone == "A Site" and r1.victim_cohort is Cohort.SQUAD
    squad = squad_rounds(make_match([RoundSpec("Red", kills)]))[0]
    assert squad.first_death_avenged is True


def test_kill_distances_are_read_from_the_snapshot():
    # R1 dies at (-1000, 0); its killer stands 1,000 units away, R2 at 300 units, the other Red players far.
    positions = {"B1": (-1000, 1000), "R2": (-1000, 300), "R3": (2000, 0), "R4": (2000, 400), "R5": (2000, 800)}
    fact = extract_kills(contexts(make_match([RoundSpec("Blue", [Kill(5000, "B1", "R1", positions=positions)])])))[0]
    assert fact.distance == pytest.approx(1000)
    assert fact.nearest_teammate == pytest.approx(300)
    assert fact.killer_zone == "A Site" and fact.victim_team_alive == 5 and fact.killer_team_alive == 5
    # Mean distance between R2, R3, R4 and R5.
    assert fact.team_spread is not None and fact.team_spread > 1000


def test_kill_means_treats_unnamed_weapons_as_abilities():
    kills = [
        Kill(1000, "R1", "B1"),
        Kill(2000, "R1", "B2", weapon=None),
        Kill(3000, "R1", "B3", weapon="Blade Storm", weapon_type="Ability"),
        Kill(4000, "R1", "B4", weapon=None, weapon_type="Melee"),
        Kill(5000, "R1", "B5", weapon=None, weapon_type="Bomb"),
    ]
    means = [k.means for k in extract_kills(contexts(make_match([RoundSpec("Red", kills)])))]
    assert means == [KillMeans.WEAPON, KillMeans.ABILITY, KillMeans.ABILITY, KillMeans.MELEE, KillMeans.SPIKE]


def test_attack_lost_without_plant_with_attackers_alive_is_a_timeout():
    match = make_match([RoundSpec("Blue", [Kill(5000, "B1", "R1")], result="")])
    squad = squad_rounds(match)[0]
    assert (squad.side, squad.won, squad.timeout) == (Side.ATTACK, False, True)


def test_round_context_follows_the_score_and_the_pistol():
    match = make_match([RoundSpec("Red"), RoundSpec("Red"), RoundSpec("Blue"), RoundSpec("Blue"), RoundSpec("Red")])
    r1, r2, r3, r4, r5 = squad_rounds(match)
    assert (r1.score_diff, r1.previous_won, r1.pistol_won) == (0, None, None)
    assert (r2.pistol_won, r2.second_round_won) == (True, None)
    # Round 3 is the bonus round: pistol and round 2 won.
    assert (r3.score_diff, r3.pistol_won, r3.second_round_won) == (2, True, True)
    assert (r4.previous_losses, r4.pistol_won) == (1, None)
    assert (r5.score_diff, r5.previous_losses, r5.previous_won) == (0, 2, False)


def test_defuse_and_ceremony_are_kept():
    spec = RoundSpec("Blue", plant=(40_000, "A", "R1"), defuse=(70_000, "B2"), result="Defuse", ceremony="CeremonyClutch")
    squad = squad_rounds(make_match([spec]))[0]
    assert (squad.planted, squad.planter, squad.defused, squad.defuser) == (True, "R1", True, "B2")
    assert squad.ceremony == "CeremonyClutch" and squad.plant_location is not None and squad.last_event_ms == 70_000


def test_player_facts_credit_first_blood_kast_and_clutch():
    kills = [Kill(1000, "R1", "B1")] + [Kill(2000 + i * 1000, f"B{i}", f"R{i}") for i in range(2, 6)] + [Kill(9000, "R1", "B2")]
    by_name = players(make_match([RoundSpec("Blue", kills)]))
    r1 = by_name["R1"]
    assert r1.first_blood and r1.first_blood_location is not None
    assert by_name["B1"].first_death
    assert (r1.kills, r1.survived, r1.kast) == (2, True, True)
    # R1 was left alone against four opponents and lost the round.
    assert (r1.clutch_versus, r1.clutch_won) == (4, False)
    assert by_name["R2"].deaths == 1 and not by_name["R2"].kast


def test_kills_outnumbered_and_multikill_span():
    kills = [Kill(1000, "B1", "R2"), Kill(2000, "B1", "R3"), Kill(4000, "R1", "B1"), Kill(9000, "R1", "B2")]
    r1 = players(make_match([RoundSpec("Red", kills)]))["R1"]
    # Both kills came while Red was 3 against 5, then 3 against 4.
    assert (r1.kills, r1.kills_outnumbered, r1.multikill_span_ms) == (2, 2, 5000)


def test_damage_received_and_economy_are_kept():
    by_name = players(make_match([RoundSpec("Red", [Kill(1000, "R1", "B1")])]))
    b1 = by_name["B1"]
    assert (b1.damage_received, b1.headshots_received, b1.bodyshots_received) == (150, 1, 1)
    assert (by_name["R1"].armor, by_name["R1"].loadout, by_name["R1"].remaining, by_name["R1"].afk) == ("Heavy Armor", 4000, 300, False)


def test_match_facts_count_the_score_and_read_ranks():
    match = make_match([RoundSpec("Red"), RoundSpec("Red"), RoundSpec("Blue")])
    squad = next(m for m in extract_matches(contexts(match)) if m.cohort is Cohort.SQUAD)
    assert (squad.won, squad.rounds_won, squad.rounds_lost, squad.start_side) == (True, 2, 1, Side.ATTACK)
    assert squad.lineup == ("R1", "R2", "R3", "R4", "R5") and squad.tier == 15 and squad.cluster == "Paris"
    player_match = next(p for p in extract_players(contexts(match), WinProbabilityTable.from_matches([match])).matches if p.name == "R1")
    assert (player_match.tier_id, player_match.tier_name, player_match.score) == (15, "Platinum 1", 4000)


def test_empty_rounds_after_a_surrender_are_not_played_rounds():
    played = [RoundSpec("Red", [Kill(1000, "R1", "B1")]), RoundSpec("Red")]
    match = make_match(played + [RoundSpec("Red", result="Surrendered")] * 11)
    squad = next(m for m in extract_matches(contexts(match)) if m.cohort is Cohort.SQUAD)
    assert (squad.rounds_won, squad.rounds_lost) == (2, 0)
    assert len(squad_rounds(match)) == 2
    extraction = extract_players(contexts(match), WinProbabilityTable.from_matches([match]))
    assert {p.round_index for p in extraction.rounds} == {0, 1}
    assert extraction.matches[0].rounds == 2


def test_win_probability_is_smoothed_and_certain_when_a_team_is_dead():
    match = make_match([RoundSpec("Red", [Kill(1000, "R1", "B1")]), RoundSpec("Blue", [Kill(1000, "R1", "B1")])])
    table = WinProbabilityTable.from_matches([match])
    assert table.probability(0, 3, Side.ATTACK, False) == 0.0
    assert table.probability(3, 0, Side.ATTACK, False) == 1.0
    # Red won one of its two rounds at 5v4 on attack: (1 + 1) / (2 + 2).
    assert table.probability(5, 4, Side.ATTACK, False) == 0.5


def test_a_fall_before_the_first_duel_is_not_the_first_kill():
    kills = [Kill(1000, "R2", "R2", weapon=None, weapon_type="Fall"), Kill(3000, "B1", "R1")]
    match = make_match([RoundSpec("Blue", kills)])
    squad = squad_rounds(match)[0]
    assert (squad.first_kill, squad.first_kill_ms) == (False, 3000)
    by_name = players(match)
    assert by_name["B1"].first_blood and by_name["R1"].first_death and not by_name["R2"].first_death


def test_spike_detonation_is_not_a_scoreboard_death():
    kills = [Kill(1000, "R1", "B1"), Kill(90_000, "B2", "B2", weapon=None, weapon_type="Bomb")]
    by_name = players(make_match([RoundSpec("Red", kills, plant=(40_000, "A", "R1"), result="Detonate")]))
    assert (by_name["B2"].deaths, by_name["B2"].survived, by_name["B2"].zero_damage_death) == (0, False, False)
    assert by_name["B1"].deaths == 1


def test_a_revived_player_spoils_a_flawless_round():
    match = make_match([RoundSpec("Red", [Kill(1000, "R1", "B1")]), RoundSpec("Red", [Kill(1000, "B1", "R1"), Kill(5000, "R2", "B1")])])
    # R1 is revived before the second kill: five Red players are alive at the end of the round.
    match["kills"][-1]["player_locations"].append({"player": {"puuid": "r1", "name": "R1", "team": "Red"}, "location": {"x": 0, "y": 0}})
    clean, spoiled = squad_rounds(match)
    assert spoiled.alive_end == 5
    assert clean.flawless and not spoiled.flawless


def test_a_wiped_team_keeps_a_chance_once_the_spike_is_down():
    match = make_match([RoundSpec("Red", [Kill(1000, "R1", "B1")])])
    table = WinProbabilityTable.from_matches([match])
    assert table.probability(0, 1, Side.ATTACK, True) == 0.5
    assert table.probability(0, 1, Side.ATTACK, False) == 0.0


def test_a_disconnected_player_is_not_counted_alive():
    match = make_match([RoundSpec("Blue", [Kill(1000, "B1", "R1"), Kill(2000, "B1", "R2")])])
    for kill in match["kills"]:
        kill["player_locations"] = [q for q in kill["player_locations"] if q["player"]["name"] != "R5"]
    squad = squad_rounds(match)[0]
    # Red starts four against five, not 5v5 with a ghost player.
    assert squad.states == ("2v5", "3v5", "4v5")
