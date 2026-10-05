"""Escouade view: situations counted in rounds against the top ranked."""

from tests.report_cohorts import make_cohorts
from tests.report_facts import AUGUST, player_match, player_round, round_fact
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


def test_months_run_back_from_the_period_and_mix_in_the_history():
    squad = [
        round_fact(round_index=0, won=True, first_kill=True),
        round_fact(match_id="old", started_at=AUGUST, round_index=0, won=False, first_kill=False, buy=BuyType.PISTOL),
    ]
    view = squad_view(make_cohorts(rounds=squad), WinProbabilityTable([]))
    assert [m.month for m in view.months] == ["2026-05", "2026-06", "2026-07", "2026-08", "2026-09"]
    august, september = view.months[3], view.months[4]
    assert (august.label, august.matches, august.pistols.count, august.pistols.total) == ("Août", 1, 0, 1)
    assert (september.rounds.count, september.rounds.total, september.first_duels.count) == (1, 1, 1)
    assert view.months[0].rounds.total == 0


def test_kpis_before_count_the_history_only():
    squad = [
        round_fact(round_index=0, won=True),
        round_fact(match_id="old", started_at=AUGUST, round_index=0, won=False),
        round_fact(match_id="old", started_at=AUGUST, round_index=1, won=True),
    ]
    before = squad_view(make_cohorts(rounds=squad), WinProbabilityTable([])).kpis.before
    assert (before.rounds.count, before.rounds.total) == (1, 2)
    assert before.wins.total == 1


def test_opening_duels_are_broken_down_player_by_player():
    own = [player_round(round_index=i, side=Side.DEFENSE, first_blood=i == 0, first_death=i > 0) for i in range(4)]
    view = squad_view(make_cohorts(player_rounds=own, player_matches=[player_match()]), WinProbabilityTable([]))
    duel = _situation(view, "duel-defense")
    assert [(p.name, p.k, p.n) for p in duel.players] == [("Alpha", 1, 4)]
    assert _situation(view, "pistol").players == []
