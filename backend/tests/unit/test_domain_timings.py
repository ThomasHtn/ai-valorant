"""Domain "Timings": delay between the plant and the next kill."""

from tests.report_cohorts import make_cohorts
from tests.report_facts import kill_fact, round_fact
from valostats.analysis.report.domains import timings


def test_next_kill_after_the_plant() -> None:
    cohorts = make_cohorts(
        rounds=[round_fact(planted=True, plant_ms=30_000)],
        kills=[kill_fact(ms=20_000), kill_fact(ms=34_000, victim_puuid="yankee")],
    )
    table = next(t for t in timings.tables(cohorts) if t.id == "timings-after-plant")
    own = next(r for r in table.rows if r.key == "Ascent").cells["own"]
    assert own.v == 4.0
