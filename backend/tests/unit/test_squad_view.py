"""Escouade view: situations counted in rounds against the top ranked."""

from tests.report_cohorts import make_cohorts
from tests.report_facts import round_fact
from valostats.analysis.extraction.win_probability import WinProbabilityTable
from valostats.analysis.report.squad.squad_view import squad_view
from valostats.domain.enums import BuyType, Cohort, Side


def _situation(view, key):
    return next(s for s in view.situations if s.key == key)


def test_a_gap_counts_rounds_against_the_top_ranked_rate():
    # Squad: 1 conversion out of 4; top ranked: 3 out of 4, so a top ranked team wins 2 more rounds.
    squad = [round_fact(round_index=i, first_kill=True, won=i == 0) for i in range(4)]
    top = [round_fact(match_id="t1", round_index=i, cohort=Cohort.TOP, first_kill=True, won=i < 3) for i in range(4)]
    view = squad_view(make_cohorts(rounds=squad, top_rounds=top), WinProbabilityTable([]))
    conversion = _situation(view, "conversion")
    assert (conversion.gap.k, conversion.gap.n, conversion.gap.top) == (1, 4, 0.75)
    assert conversion.gap.rounds == -2.0
    assert [(m.map_name, m.gap.rounds) for m in conversion.maps] == [("Ascent", -2.0)]


def test_a_gap_without_top_ranked_rounds_is_unknown():
    view = squad_view(make_cohorts(rounds=[round_fact(buy=BuyType.ECO)]), WinProbabilityTable([]))
    eco = _situation(view, "eco")
    assert eco.gap.n == 1 and eco.gap.top is None and eco.gap.rounds is None


def test_post_plant_and_retakes_are_split_by_site():
    squad = [
        round_fact(round_index=1, side=Side.ATTACK, planted=True, plant_site="A", won=True),
        round_fact(round_index=2, side=Side.ATTACK, planted=True, plant_site="B", won=False),
        round_fact(round_index=3, side=Side.DEFENSE, planted=True, plant_site="B", won=True),
    ]
    view = squad_view(make_cohorts(rounds=squad), WinProbabilityTable([]))
    assert [(s.site, s.gap.k, s.gap.n) for s in view.post_plant] == [("A", 1, 1), ("B", 0, 1)]
    assert [(s.site, s.gap.k, s.gap.n) for s in view.retakes] == [("B", 1, 1)]
