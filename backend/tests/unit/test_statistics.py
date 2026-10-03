import pytest

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
