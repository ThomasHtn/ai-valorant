"""Proportion tests with false discovery rate control."""

import math
from collections.abc import Callable, Sequence

from valostats.constants.analysis import FDR_Q, MIN_EXPECTED_COUNT


def two_proportions(k1: int, n1: int, k2: int, n2: int) -> float:
    """Two-sided p-value of a two-proportion z-test."""
    p = (k1 + k2) / (n1 + n2)
    se = math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2)) if 0 < p < 1 else 0
    if se == 0:
        return 1.0
    return math.erfc(abs(k1 / n1 - k2 / n2) / se / math.sqrt(2))


def fisher_exact(k1: int, n1: int, k2: int, n2: int) -> float:
    """Two-sided p-value of Fisher's exact test on the table [[k1, n1 - k1], [k2, n2 - k2]].

    Exact for small samples, where the z-test's normal approximation is too optimistic.
    """
    successes, total = k1 + k2, n1 + n2
    log_all = _log_choose(total, successes)

    def log_probability(a: int) -> float:
        # Probability of `a` successes in the first group, given the margins (hypergeometric).
        return _log_choose(n1, a) + _log_choose(n2, successes - a) - log_all

    observed = log_probability(k1)
    lowest, highest = max(0, successes - n2), min(successes, n1)
    # Sum every table at most as likely as the observed one (tolerance for float rounding).
    p = sum(math.exp(lp) for a in range(lowest, highest + 1) if (lp := log_probability(a)) <= observed + 1e-9)
    return min(1.0, p)


def proportions_p_value(k1: int, n1: int, k2: int, n2: int) -> float:
    """Two-sided p-value of the difference between two proportions.

    z-test, or Fisher's exact test when an expected count is under `MIN_EXPECTED_COUNT` (small samples).
    """
    if not n1 or not n2:
        return 1.0
    pooled = (k1 + k2) / (n1 + n2)
    smallest_expected = min(n1 * pooled, n1 * (1 - pooled), n2 * pooled, n2 * (1 - pooled))
    if smallest_expected < MIN_EXPECTED_COUNT:
        return fisher_exact(k1, n1, k2, n2)
    return two_proportions(k1, n1, k2, n2)


def _log_choose(n: int, k: int) -> float:
    return math.lgamma(n + 1) - math.lgamma(k + 1) - math.lgamma(n - k + 1)


def benjamini_hochberg[T](tests: Sequence[T], p_value: Callable[[T], float]) -> list[T]:
    """The tests that survive the false discovery rate, smallest p-value first."""
    ranked = sorted(tests, key=p_value)
    cutoff = 0
    for i, test in enumerate(ranked, 1):
        if p_value(test) <= FDR_Q * i / len(ranked):
            cutoff = i
    return ranked[:cutoff]
