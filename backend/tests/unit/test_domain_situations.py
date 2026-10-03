"""Domain "Situations": time spent with more or fewer players, clutches."""

from tests.report_cohorts import make_cohorts
from tests.report_facts import kill_fact, player_match, player_round, round_fact
from valostats.analysis.report.domains import situations


def test_numbers_times_follow_the_alive_counts_between_kills() -> None:
    red_round = round_fact(team_id="Red", last_event_ms=40_000)
    kills = [
        # Red kills first at 10 s: Red is ahead from 10 s to 30 s.
        kill_fact(ms=10_000, killer_team="Red", victim_team="Blue", victim_team_alive=5, killer_team_alive=5),
        # Blue evens it at 30 s: 4v4 until the end.
        kill_fact(ms=30_000, killer_team="Blue", victim_team="Red", victim_team_alive=5, killer_team_alive=4),
    ]
    times = situations.numbers_times([red_round], kills)
    assert times[("m1", 3, "Red")] == (20_000, 0, 40_000)


def test_clutch_sizes_show_tries_and_wins() -> None:
    cohorts = make_cohorts(
        player_matches=[player_match()],
        player_rounds=[
            player_round(clutch_versus=1, clutch_won=True),
            player_round(round_index=4, clutch_versus=1, clutch_won=False),
            player_round(round_index=5, clutch_versus=2, clutch_won=False),
        ],
    )
    sizes = next(t for t in situations.tables(cohorts) if t.id == "situations-clutch-sizes")
    by_key = {r.key: r.cells for r in sizes.rows}
    assert by_key["1v1"]["wn"].v == "1/2"
    assert by_key["1v1"]["won"].v == 0.5
    assert by_key["all"]["tries"].v == 3
