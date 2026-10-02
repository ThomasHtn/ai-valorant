from tests.factories import SQUAD, TEST_MAP, Kill, RoundSpec, make_match
from valostats.analysis.extraction.economy import buy_type
from valostats.analysis.extraction.henrik_payload import attacker
from valostats.analysis.extraction.player_facts import extract_players
from valostats.analysis.extraction.round_facts import extract_rounds
from valostats.analysis.extraction.timeline import round_timelines
from valostats.analysis.extraction.win_probability import WinProbabilityTable
from valostats.domain.enums import BuyType, Cohort, KillerCohort, Side

MAPS = {TEST_MAP.name: TEST_MAP}


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
    assert [s.event.kind for s in states[1:]] == ["kill", "plant"]
    assert states[1].alive == {"Red": 5, "Blue": 4}
    assert states[2].planted


def test_squad_rounds_are_labelled_and_opponent_rounds_mirror_them():
    match = make_match([RoundSpec("Red", [Kill(3000, "R1", "B1"), Kill(4000, "R2", "B2")])])
    rounds = extract_rounds([match], MAPS, SQUAD).rounds
    squad = next(r for r in rounds if r.cohort is Cohort.SQUAD)
    opponents = next(r for r in rounds if r.cohort is Cohort.OPPONENT)
    assert (squad.side, squad.won, squad.first_kill, squad.max_advantage) == (Side.ATTACK, True, True, 2)
    assert (opponents.side, opponents.won, opponents.first_kill, opponents.min_advantage) == (Side.DEFENSE, False, False, -2)
    assert "5v4" in squad.states and "5v3" in squad.states


def test_match_without_a_five_stack_is_skipped():
    match = make_match([RoundSpec("Red")])
    assert extract_rounds([match], MAPS, {"r1", "r2"}).rounds == []


def test_death_is_traded_when_a_teammate_kills_the_killer_within_three_seconds():
    match = make_match(
        [RoundSpec("Red", [Kill(10_000, "B1", "R1"), Kill(12_000, "R2", "B1"), Kill(20_000, "B2", "R3"), Kill(24_000, "R4", "B2")])]
    )
    deaths = extract_rounds([match], MAPS, SQUAD).deaths
    r1, b1, r3, _ = deaths
    assert (r1.traded, r1.avenger, r1.opening, r1.killer_cohort) == (True, "R2", True, KillerCohort.OPPONENT)
    assert not b1.traded
    # Four seconds is too late for a revenge.
    assert not r3.traded
    assert r1.callout == "A Site"


def test_player_facts_credit_first_blood_kast_and_clutch():
    kills = [Kill(1000, "R1", "B1")] + [Kill(2000 + i * 1000, f"B{i}", f"R{i}") for i in range(2, 6)] + [Kill(9000, "R1", "B2")]
    match = make_match([RoundSpec("Blue", kills)])
    table = WinProbabilityTable.from_matches([match])
    players = {p.name: p for p in extract_players([match], MAPS, table, SQUAD).rounds}
    r1 = players["R1"]
    assert r1.first_blood and r1.first_blood_location is not None
    assert players["B1"].first_death
    assert (r1.kills, r1.survived, r1.kast) == (2, True, True)
    # R1 was left alone against four opponents and lost the round.
    assert (r1.clutch_versus, r1.clutch_won) == (4, False)
    assert players["R2"].deaths == 1 and not players["R2"].kast


def test_win_probability_is_smoothed_and_certain_when_a_team_is_dead():
    match = make_match([RoundSpec("Red", [Kill(1000, "R1", "B1")]), RoundSpec("Blue", [Kill(1000, "R1", "B1")])])
    table = WinProbabilityTable.from_matches([match])
    assert table.probability(0, 3, Side.ATTACK, False) == 0.0
    assert table.probability(3, 0, Side.ATTACK, False) == 1.0
    # Red won one of its two rounds at 5v4 on attack: (1 + 1) / (2 + 2).
    assert table.probability(5, 4, Side.ATTACK, False) == 0.5
