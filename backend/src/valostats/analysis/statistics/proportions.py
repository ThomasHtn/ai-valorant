"""Proportion tests with false discovery rate control."""

import math
from collections.abc import Callable, Sequence

from valostats.constants.analysis import FDR_Q


def two_proportions(k1: int, n1: int, k2: int, n2: int) -> float:
    """Two-sided p-value of a two-proportion z-test."""
    p = (k1 + k2) / (n1 + n2)
    se = math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2)) if 0 < p < 1 else 0
    if se == 0:
        return 1.0
    return math.erfc(abs(k1 / n1 - k2 / n2) / se / math.sqrt(2))


def one_proportion(k: int, n: int, p0: float = 0.5) -> float:
    """Two-sided p-value of a z-test against a fixed proportion."""
    return math.erfc(abs(k / n - p0) / math.sqrt(p0 * (1 - p0) / n) / math.sqrt(2))


def mean_vs_reference(total: float, n: int, sum_of_squares: float, reference: float) -> float:
    """Two-sided p-value of a z-test of a sample mean against a reference treated as exact."""
    if n < 2:
        return 1.0
    variance = sum_of_squares / n - (total / n) ** 2
    if variance <= 0:
        return 1.0
    return math.erfc(abs(total / n - reference) / math.sqrt(variance / n) / math.sqrt(2))


def benjamini_hochberg[T](tests: Sequence[T], p_value: Callable[[T], float]) -> list[T]:
    """The tests that survive the false discovery rate, smallest p-value first."""
    ranked = sorted(tests, key=p_value)
    cutoff = 0
    for i, test in enumerate(ranked, 1):
        if p_value(test) <= FDR_Q * i / len(ranked):
            cutoff = i
    return ranked[:cutoff]
