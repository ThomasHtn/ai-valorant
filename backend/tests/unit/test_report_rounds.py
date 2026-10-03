"""Loss causes, best moment of a round, round sheet and minimap projection."""

from datetime import date

import pytest

from tests.factories import TEST_MAP, Kill, RoundSpec, make_match
from tests.report_facts import SEPTEMBER, kill_fact, round_fact
from valostats.analysis.extraction.win_probability import WinProbabilityTable
from valostats.analysis.report.foundation.death_rules import is_isolated
from valostats.analysis.report.rounds.loss_causes import loss_cause
from valostats.analysis.report.rounds.minimap import _Projector, density
from valostats.analysis.report.rounds.round_sheet import round_sheet
from valostats.analysis.report.rounds.round_states import best_moment, biggest_drop, team_states
from valostats.domain.enums import BuyType, LossCause, Side
from valostats.domain.facts import Location, WinProbabilityCell
from valostats.schemas.report.rounds import EventKind, RoundLine

LOST = {"won": False, "max_advantage": 0, "states": ("5v5", "4v5"), "first_kill": True, "first_death_avenged": None}


@pytest.mark.parametrize(
    ("changes", "cause"),
    [
        ({"max_advantage": 2}, LossCause.LEAD_THROWN),
        ({"states": ("5v5", "1v1")}, LossCause.CLUTCH_LOST),
        ({"planted": True, "advantage_at_plant": 0, "defused": True}, LossCause.POST_PLANT_LOST),
        ({"side": Side.DEFENSE, "planted": True, "advantage_at_plant": 1, "result": "Elimination"}, LossCause.RETAKE_FAILED),
        ({"first_kill": False, "first_death_avenged": False, "states": ("5v5", "4v5", "3v5")}, LossCause.OPENING_LOST),
        ({"buy": BuyType.ECO, "opp_buy": BuyType.FULL}, LossCause.ECONOMY_GAP),
        ({"timeout": True}, LossCause.TIME_OUT),
        ({}, LossCause.EXECUTE_FAILED),
        ({"side": Side.DEFENSE}, LossCause.DUELS_LOST),
    ],
)
def test_loss_cause_rules(changes: dict[str, object], cause: LossCause) -> None:
    assert loss_cause(round_fact(**{**LOST, **changes})) is cause


def test_opening_lost_needs_the_team_never_back_to_equal() -> None:
    back_to_equal = round_fact(**{**LOST, "first_kill": False, "first_death_avenged": False, "states": ("5v5", "4v5", "4v4")})
    assert loss_cause(back_to_equal) is LossCause.EXECUTE_FAILED


def test_won_round_has_no_cause() -> None:
    assert loss_cause(round_fact(won=True)) is None


def test_best_moment_reads_the_state_before_each_kill() -> None:
    fact = round_fact(team_id="Red", side=Side.ATTACK, alive_end=0, opp_alive_end=2)
    kills = [
        kill_fact(ms=10_000, victim_team="Blue", killer_team="Red", victim_team_alive=5, killer_team_alive=5),
        kill_fact(ms=20_000, victim_team="Blue", killer_team="Red", victim_team_alive=4, killer_team_alive=5),
        kill_fact(ms=30_000, victim_team="Red", killer_team="Blue", victim_team_alive=5, killer_team_alive=3),
    ]
    states = team_states(fact, kills)
    assert [s.label for s in states] == ["5v5", "5v5", "5v4", "5v3", "0v2"]
    table = WinProbabilityTable([WinProbabilityCell(5, 3, Side.ATTACK, False, 9, 10), WinProbabilityCell(5, 4, Side.ATTACK, False, 6, 10)])
    best = best_moment(fact, states, table)
    assert best is not None and best.state == "5v3"
    assert best.probability == pytest.approx(10 / 12)


def test_biggest_drop_counts_the_end_of_a_lost_round() -> None:
    fact = round_fact(team_id="Red", side=Side.ATTACK, won=False, alive_end=0, opp_alive_end=2)
    kills = [
        kill_fact(ms=10_000, victim_team="Blue", killer_team="Red", victim_team_alive=5, killer_team_alive=5),
        kill_fact(ms=20_000, victim_team="Red", killer_team="Blue", victim_team_alive=5, killer_team_alive=4),
    ]
    table = WinProbabilityTable([WinProbabilityCell(5, 5, Side.ATTACK, False, 5, 10), WinProbabilityCell(5, 4, Side.ATTACK, False, 8, 10)])
    states = team_states(fact, kills)
    assert [s.label for s in states] == ["5v5", "5v5", "5v4", "0v2"]
    # The lost end falls from the 5v4 chance to 0, more than any kill did.
    assert biggest_drop(fact, states, table) == pytest.approx(table.probability(5, 4, Side.ATTACK, False))


def test_round_sheet_events_positions_and_economy() -> None:
    match = make_match(
        [
            RoundSpec(
                winner="Blue",
                kills=[Kill(10_000, "R1", "B1"), Kill(12_000, "B2", "R1"), Kill(13_000, "R2", "B2")],
                plant=(20_000, "A", "R2"),
                defuse=(50_000, "B3"),
                result="Defuse",
            )
        ]
    )
    line = RoundLine(
        match_id="m1", round_number=1, day=date(2026, 9, 30), started_at=SEPTEMBER, map_name="Ascent", side=Side.ATTACK,
        buy=BuyType.PISTOL, opp_buy=BuyType.PISTOL, score_before="0-0", won=False, result="Defuse",
        cause=LossCause.POST_PLANT_LOST, max_advantage=1, best_state="5v4", best_probability=0.6,
    )  # fmt: skip
    sheet = round_sheet(match, line, "Red", TEST_MAP, WinProbabilityTable([]))
    kinds = [e.kind for e in sheet.events]
    assert kinds == [EventKind.KILL, EventKind.KILL, EventKind.KILL, EventKind.PLANT, EventKind.DEFUSE]
    first, second = sheet.events[0], sheet.events[1]
    assert (first.own_alive, first.opp_alive, first.squad_actor) == (5, 4, True)
    # B2 avenges B1 by killing R1, then R2 avenges R1.
    assert first.text == "R1 tue B1 à A Site (Vandal), revenge par B2 à 0:12"
    assert second.text.endswith("revenge par R2 à 0:13")
    victim = next(p for p in first.positions if not p.alive)
    assert (victim.name, victim.squad) == ("B1", False)
    assert sheet.events[3].text == "R2 plante le spike en A"
    # The defuse ends the round for the defenders.
    assert sheet.events[-1].win_probability == 0.0
    assert len(sheet.squad_economy) == 5 and sheet.squad_economy[0].armor == "Heavy Armor"


def test_projector_drops_points_off_the_map() -> None:
    projector = _Projector(TEST_MAP, {})
    inside = kill_fact(victim_location=Location(0, 0))
    # y = 10 000 game units lands at x = 1.5 on the test minimap.
    outside = kill_fact(victim_location=Location(0, 10_000))
    assert projector.death(inside) is not None
    assert projector.death(outside) is None
    assert projector.out_of_map == 1


def test_isolated_death_ignores_the_last_player_alive() -> None:
    assert is_isolated(kill_fact(nearest_teammate=2000.0))
    assert not is_isolated(kill_fact(nearest_teammate=900.0))
    assert not is_isolated(kill_fact(nearest_teammate=None))


def test_density_counts_points_per_cell_and_drops_off_map_ones() -> None:
    cells = density([(0.1, 0.1), (0.12, 0.12), (0.9, 0.5), (1.0, 1.0), (1.4, 0.5)], 4)
    assert [(c.x, c.y, c.count) for c in cells] == [(0.125, 0.125, 2), (0.875, 0.625, 1), (0.875, 0.875, 1)]
