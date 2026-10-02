import pytest

from valostats.analysis.statistics.correlation import pearson
from valostats.analysis.statistics.proportions import benjamini_hochberg, mean_vs_reference, one_proportion, two_proportions
from valostats.analysis.statistics.rates import rate


def test_identical_proportions_are_not_significant():
    assert two_proportions(30, 60, 30, 60) == pytest.approx(1.0)


def test_a_large_gap_is_significant():
    assert two_proportions(45, 60, 15, 60) < 0.001


def test_one_proportion_against_half():
    assert one_proportion(50, 100) == pytest.approx(1.0)
    assert one_proportion(80, 100) < 0.001


def test_mean_without_variation_cannot_be_tested():
    assert mean_vs_reference(total=10, n=5, sum_of_squares=20, reference=1.0) == 1.0


def test_benjamini_hochberg_keeps_only_the_p_values_under_the_stepped_threshold():
    tests = [0.001, 0.02, 0.03, 0.5]
    # Thresholds for q = 0.10: 0.025, 0.05, 0.075, 0.1.
    assert benjamini_hochberg(tests, lambda p: p) == [0.001, 0.02, 0.03]


def test_pearson_needs_enough_points_and_variation():
    assert pearson([1, 2, 3], [1, 2, 3]) is None
    assert pearson([1] * 10, list(range(10))) is None
    assert pearson(list(range(10)), list(range(10))) == pytest.approx(1.0)


def test_rate_counts_truthy_successes():
    result = rate([1, 0, 2, 0], lambda x: x)
    assert (result.count, result.total, result.value) == (2, 4, 0.5)
    assert rate([], bool).value is None
