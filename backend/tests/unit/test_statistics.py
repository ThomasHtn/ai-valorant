import pytest

from valostats.analysis.statistics.clustering import effective_counts, group_counts, intraclass_correlation
from valostats.analysis.statistics.proportions import benjamini_hochberg, two_proportions
from valostats.analysis.statistics.rates import rate


def test_identical_proportions_are_not_significant():
    assert two_proportions(30, 60, 30, 60) == pytest.approx(1.0)


def test_a_large_gap_is_significant():
    assert two_proportions(45, 60, 15, 60) < 0.001


def test_benjamini_hochberg_keeps_only_the_p_values_under_the_stepped_threshold():
    tests = [0.001, 0.02, 0.03, 0.5]
    # Thresholds for q = 0.10: 0.025, 0.05, 0.075, 0.1.
    assert benjamini_hochberg(tests, lambda p: p) == [0.001, 0.02, 0.03]


def test_rate_counts_truthy_successes():
    result = rate([1, 0, 2, 0], lambda x: x)
    assert (result.count, result.total, result.value) == (2, 4, 0.5)
    assert rate([], bool).value is None


def test_independent_groups_have_no_intraclass_correlation():
    # Every match at the same rate: the spread is below binomial noise, so no correction.
    assert intraclass_correlation([(10, 20)] * 12) == 0.0
    assert intraclass_correlation([(10, 20)] * 3) == 0.0


def test_matches_won_or_lost_whole_are_fully_correlated():
    groups = [(20, 20)] * 6 + [(0, 20)] * 6
    assert intraclass_correlation(groups) == pytest.approx(1.0)
    # 240 rounds of 12 matches are then worth 12 tries.
    assert effective_counts(120, 240, 12, 1.0) == (6, 12)


def test_effective_counts_follow_kish_design_effect():
    # 20 rounds per match and a correlation of 0.05: design effect 1.95.
    assert effective_counts(110, 220, 11, 0.05) == (56, 113)
    assert effective_counts(5, 10, 10, 0.3) == (5, 10)
    assert group_counts(["a1", "a0", "b1"], lambda f: f.endswith("1"), lambda f: f[0]) == [(1, 2), (1, 1)]
