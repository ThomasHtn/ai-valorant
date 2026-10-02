"""Proportion tests with false discovery rate control."""
import math

FDR_Q = 0.10


def two_proportions(k1, n1, k2, n2):
    """Two-sided p-value of a two-proportion z-test."""
    p = (k1 + k2) / (n1 + n2)
    se = math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2)) if 0 < p < 1 else 0
    if se == 0:
        return 1.0
    return math.erfc(abs(k1 / n1 - k2 / n2) / se / math.sqrt(2))


def one_proportion(k, n, p0=0.5):
    """Two-sided p-value of a z-test against a fixed proportion."""
    return math.erfc(abs(k / n - p0) / math.sqrt(p0 * (1 - p0) / n) / math.sqrt(2))


def confirmed(tests):
    """Benjamini-Hochberg: the subset of tests (dicts with 'p') that survive the FDR."""
    ranked = sorted(tests, key=lambda t: t["p"])
    cutoff = 0
    for i, t in enumerate(ranked, 1):
        if t["p"] <= FDR_Q * i / len(ranked):
            cutoff = i
    return ranked[:cutoff]
