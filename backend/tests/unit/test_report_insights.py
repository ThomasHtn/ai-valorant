"""Points forts et faibles, detections and distributions on hand-made facts."""

from collections.abc import Sequence
from typing import Any

import pytest

from tests.report_facts import AUGUST, SEPTEMBER, kill_fact, match_fact, round_fact
from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohorts, build_cohorts, build_index
from valostats.analysis.report.foundation.period_selection import PeriodQuery, resolve
from valostats.analysis.report.insights.detections import zone_first_deaths
from valostats.analysis.report.insights.distributions import Binning, histogram, round_length_ms
from valostats.analysis.report.insights.finding_tests import FindingTest, Unit, always
from valostats.analysis.report.insights.findings import FindingContext, run_test, weakness_loss_causes
from valostats.analysis.statistics.proportions import fisher_exact, proportions_p_value, two_proportions
from valostats.domain.enums import Cohort, KillerCohort, LossCause, Reference, Side
from valostats.schemas.report.detections import RepetitionKind
from valostats.schemas.report.findings import FindingGroup


def make_cohorts(rounds: Sequence[Any] = (), kills: Sequence[Any] = (), top_rounds: Sequence[Any] = ()) -> ReportCohorts:
    matches = [match_fact(), match_fact(match_id="old", started_at=AUGUST)]
    window = resolve(PeriodQuery(month="2026-09"), [m.started_at for m in matches], [m.patch for m in matches])
    facts = {FactKind.MATCHES: matches, FactKind.ROUNDS: list(rounds), FactKind.KILLS: list(kills), FactKind.PLAYER_ROUNDS: [],
             FactKind.PLAYER_MATCHES: []}  # fmt: skip
    return build_cohorts(window, facts, build_index([], top_rounds, [], [], [], Cohort.TOP))


def test_fisher_is_exact_on_a_tiny_table() -> None:
    # 3/3 against 0/3: the two most extreme tables each have probability 1/20.
    assert fisher_exact(3, 3, 0, 3) == pytest.approx(0.1)
    assert fisher_exact(2, 4, 2, 4) == pytest.approx(1.0)


def test_small_samples_switch_to_fisher() -> None:
    assert proportions_p_value(3, 3, 0, 3) == pytest.approx(fisher_exact(3, 3, 0, 3))
    assert proportions_p_value(40, 80, 60, 80) == pytest.approx(two_proportions(40, 80, 60, 80))
    assert proportions_p_value(1, 0, 1, 2) == 1.0


def test_gap_in_rounds_is_rate_gap_times_sample_for_round_outcomes() -> None:
    # Squad wins 4 of 20 retakes, top ranked 50 %: 6 rounds below the reference.
    squad = [round_fact(round_index=i, won=i < 4, side=Side.DEFENSE, planted=True) for i in range(20)]
    top = [round_fact(match_id=f"t{i}", cohort=Cohort.TOP, won=i % 2 == 0, side=Side.DEFENSE, planted=True) for i in range(40)]
    test = FindingTest(
        group=FindingGroup.TEAM,
        scope="Global",
        metric="Retake gagné",
        kind="retake",
        unit=Unit.ROUNDS,
        success=lambda r: r.won,
        among=lambda r: r.planted,
        reference=Reference.TOP,
        round_outcome=True,
    )
    tested = run_test(test, FindingContext(make_cohorts(rounds=squad, top_rounds=top)))
    assert tested is not None
    assert tested.gap_rounds == pytest.approx(-6.0)
    assert tested.leverage == 1.0
    # The rounds to rewatch are the lost retakes.
    assert all(not r.won for r in tested.rewatch_facts)
    assert tested.matches == 1
    # Every lost retake was planted while even: the weakness points at the retake itself.
    assert weakness_loss_causes(tested) == {LossCause.RETAKE_FAILED: 16}


def test_too_small_samples_are_not_tested() -> None:
    squad = [round_fact(round_index=i) for i in range(5)]
    test = FindingTest(FindingGroup.TEAM, "Global", "Rounds gagnés", "rounds", Unit.ROUNDS, lambda r: r.won, always, Reference.TOP)
    assert run_test(test, FindingContext(make_cohorts(rounds=squad, top_rounds=[round_fact(cohort=Cohort.TOP)]))) is None


def test_zone_first_deaths_need_four_deaths_over_two_matches() -> None:
    def first_death(match_id: str, round_index: int) -> Any:
        return kill_fact(match_id=match_id, round_index=round_index, killer_cohort=KillerCohort.OPPONENT, victim_cohort=Cohort.SQUAD,
                         victim="Alpha", victim_side=Side.ATTACK, victim_zone="A Main", started_at=SEPTEMBER)  # fmt: skip

    repeated = [first_death("m1", i) for i in range(3)] + [first_death("m2", 0)]
    one_match = [first_death("m1", i) for i in range(4)]
    matches = [match_fact(), match_fact(match_id="m2"), match_fact(match_id="old", started_at=AUGUST)]
    window = resolve(PeriodQuery(month="2026-09"), [m.started_at for m in matches], [m.patch for m in matches])

    def cohorts_with(kills: list[Any]) -> ReportCohorts:
        facts = {
            FactKind.MATCHES: matches,
            FactKind.ROUNDS: [],
            FactKind.KILLS: kills,
            FactKind.PLAYER_ROUNDS: [],
            FactKind.PLAYER_MATCHES: [],
        }
        return build_cohorts(window, facts, build_index([], [], [], [], [], Cohort.TOP))

    found = zone_first_deaths(cohorts_with(repeated))
    assert [(r.kind, r.zone, r.count, r.matches) for r in found] == [(RepetitionKind.ZONE_FIRST_DEATHS, "A Main", 4, 2)]
    assert zone_first_deaths(cohorts_with(one_match)) == []


def test_zone_first_deaths_skip_zones_where_top_ranked_die_as_often() -> None:
    def first_death(match_id: str, round_index: int, zone: str, cohort: Cohort = Cohort.SQUAD) -> Any:
        return kill_fact(match_id=match_id, round_index=round_index, killer_cohort=KillerCohort.OPPONENT, victim_cohort=cohort,
                         victim="Alpha", victim_side=Side.ATTACK, victim_zone=zone, started_at=SEPTEMBER)  # fmt: skip

    squad = [first_death(m, i, "A Main") for m in ("m1", "m2") for i in range(2)]
    squad += [first_death(m, i, "B Main") for m in ("m1", "m2") for i in range(2, 4)]
    # Top ranked die first at A Main half the time, like the squad, and never at B Main.
    top = [first_death("t1", i, "A Main" if i % 2 else "Mid", Cohort.TOP) for i in range(10)]
    matches = [match_fact(), match_fact(match_id="m2"), match_fact(match_id="old", started_at=AUGUST)]
    window = resolve(PeriodQuery(month="2026-09"), [m.started_at for m in matches], [m.patch for m in matches])
    facts = {FactKind.MATCHES: matches, FactKind.ROUNDS: [], FactKind.KILLS: squad, FactKind.PLAYER_ROUNDS: [],
             FactKind.PLAYER_MATCHES: []}  # fmt: skip
    cohorts = build_cohorts(window, facts, build_index([], [], top, [], [], Cohort.TOP))
    assert [r.zone for r in zone_first_deaths(cohorts)] == ["B Main"]


def test_histogram_puts_large_values_in_the_open_last_bin() -> None:
    binning = Binning("s", 5, 20)
    result = histogram([0, 4.9, 5, 19.9, 20, 300], binning)
    assert result.counts == [2, 1, 0, 1, 2]
    assert result.shares[0] == pytest.approx(2 / 6, abs=1e-4)
    assert [b.label for b in binning.bins()][-1] == "20+ s"
    assert binning.bins()[-1].end is None


def test_round_length_adds_the_spike_timer_after_a_detonation() -> None:
    assert round_length_ms(round_fact(result="Detonate", plant_ms=50_000, last_event_ms=60_000)) == 95_000
    assert round_length_ms(round_fact(result="", last_event_ms=30_000)) == 100_000
    assert round_length_ms(round_fact(result="Elimination", alive_end=0, last_event_ms=42_000)) == 42_000
