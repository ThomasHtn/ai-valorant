"""Domain "Spike": planter survival, post-plant by numbers at the plant."""

from tests.report_cohorts import make_cohorts
from tests.report_facts import player_match, player_round, round_fact
from valostats.analysis.report.domains import spike
from valostats.schemas.report.tables import StatTable


def _table(tables: list[StatTable], table_id: str) -> StatTable:
    return next(t for t in tables if t.id == table_id)


def test_planter_survival_only_counts_the_rounds_the_player_planted() -> None:
    cohorts = make_cohorts(
        rounds=[round_fact(planted=True, plant_site="A", planter="Alpha", plant_ms=30_000)],
        player_rounds=[player_round(survived=False), player_round(round_index=4, survived=True)],
        player_matches=[player_match()],
    )
    row = _table(spike.tables(cohorts), "spike-players").rows[0]
    assert row.cells["plants"].v == 1
    assert (row.cells["survive"].v, row.cells["survive"].n) == (0.0, 1)


def test_post_plant_is_split_by_the_numbers_at_the_plant() -> None:
    cohorts = make_cohorts(
        rounds=[
            round_fact(planted=True, advantage_at_plant=-1, won=False),
            round_fact(round_index=4, planted=True, advantage_at_plant=2),
        ]
    )
    cells = {r.key: r.cells["postplant"] for r in _table(spike.tables(cohorts), "spike-advantage").rows}
    assert cells["down"].v == 0.0
    assert cells["up2"].v == 1.0
    assert cells["even"].n == 0
