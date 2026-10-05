"""Statistics only cover the current competitive map pool."""

from tests.report_facts import AUGUST, match_fact, round_fact
from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohort, build_cohorts, build_index
from valostats.analysis.report.foundation.period_selection import PeriodQuery, resolve
from valostats.domain.enums import Cohort

POOL = frozenset({"Ascent"})


def _cohorts(pool: frozenset[str]):
    matches = [
        match_fact(match_id="m1"),
        match_fact(match_id="m2", map_name="Breeze"),
        match_fact(match_id="old", map_name="Breeze", started_at=AUGUST),
    ]
    rounds = [round_fact(match_id="m1"), round_fact(match_id="m2", map_name="Breeze")]
    window = resolve(PeriodQuery(month="2026-09"), [m.started_at for m in matches], [m.patch for m in matches])
    facts = {FactKind.MATCHES: matches, FactKind.ROUNDS: rounds}
    facts |= {kind: [] for kind in (FactKind.KILLS, FactKind.PLAYER_ROUNDS, FactKind.PLAYER_MATCHES)}
    return build_cohorts(window, facts, build_index([], [], [], [], [], Cohort.TOP), pool=pool)


def test_maps_out_of_the_pool_leave_the_statistics():
    cohorts = _cohorts(POOL)
    assert [m.match_id for m in cohorts.matches()] == ["m1"]
    assert [r.match_id for r in cohorts.squad(FactKind.ROUNDS)] == ["m1"]
    assert cohorts.maps() == ["Ascent"]
    assert not cohorts.select(FactKind.MATCHES, ReportCohort.HISTORY)


def test_without_a_known_pool_every_map_is_kept():
    cohorts = _cohorts(frozenset())
    assert sorted(m.match_id for m in cohorts.matches()) == ["m1", "m2"]
