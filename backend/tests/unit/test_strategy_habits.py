"""Stratégie habits: priced with the top ranked win rates with and without the habit."""

from tests.report_cohorts import make_cohorts
from tests.report_facts import match_fact, round_fact
from valostats.analysis.report.strategy.habits import habits
from valostats.domain.enums import Cohort


def test_a_habit_the_squad_skips_costs_what_the_top_ranked_gain_with_it():
    # Top ranked: first deaths avenged win, the others lose (worth 1 round each); half are avenged.
    top = [
        round_fact(match_id="t1", round_index=i, cohort=Cohort.TOP, first_kill=False, first_death_avenged=i < 2, won=i < 2)
        for i in range(4)
    ]
    # Squad: two first deaths in one match, never avenged.
    squad = [round_fact(round_index=i, first_kill=False, first_death_avenged=False, won=False) for i in range(2)]
    trade = next(h for h in habits(make_cohorts(rounds=squad, top_rounds=top), "Ascent", 1) if h.key == "trade")
    assert (trade.top.count, trade.top.total, trade.squad.count, trade.squad.total) == (2, 4, 0, 2)
    assert (trade.won_if, trade.won_else) == (1.0, 0.0)
    assert trade.cost == -1.0


def test_a_habit_without_squad_matches_has_no_cost():
    top = [round_fact(match_id="t1", cohort=Cohort.TOP, first_kill=False, first_death_avenged=True)]
    cohorts = make_cohorts(matches=[match_fact(map_name="Lotus")], top_rounds=top)
    trade = next(h for h in habits(cohorts, "Ascent", 0) if h.key == "trade")
    assert trade.cost is None
