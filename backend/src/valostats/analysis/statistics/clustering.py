"""Effective sample sizes: rounds of one match are alike (same opponents, same form), not independent tries.

A proportion test that counts every round as an independent try is too confident. Kish's design effect
corrects it: with an intraclass correlation `icc` and `m` facts per match on average, n facts are worth
n / (1 + (m - 1) icc) independent ones.
"""

from collections import defaultdict
from collections.abc import Callable, Hashable, Iterable

from valostats.constants.analysis import MIN_ICC_GROUPS


def group_counts[T](facts: Iterable[T], success: Callable[[T], object], group: Callable[[T], Hashable]) -> list[tuple[int, int]]:
    """Successes and size of each group of facts (a match, or a player in a match)."""
    counts: defaultdict[Hashable, list[int]] = defaultdict(lambda: [0, 0])
    for fact in facts:
        cell = counts[group(fact)]
        cell[0] += bool(success(fact))
        cell[1] += 1
    return [(k, n) for k, n in counts.values()]


def intraclass_correlation(groups: list[tuple[int, int]]) -> float:
    """Correlation between two facts of one group, from how much the group rates spread (0 to 1).

    The between-group variance of the rate, over the binomial one, is the design effect; it gives the
    correlation with the mean group size. Under `MIN_ICC_GROUPS` groups the estimate is too noisy: 0.
    """
    total = sum(n for _, n in groups)
    if len(groups) < MIN_ICC_GROUPS or total == 0:
        return 0.0
    rate = sum(k for k, _ in groups) / total
    mean_size = total / len(groups)
    if rate in (0.0, 1.0) or mean_size <= 1:
        return 0.0
    between = len(groups) / (len(groups) - 1) * sum((k - rate * n) ** 2 for k, n in groups) / total**2
    design_effect = between / (rate * (1 - rate) / total)
    return min(1.0, max(0.0, (design_effect - 1) / (mean_size - 1)))


def effective_counts(count: int, total: int, groups: int, icc: float) -> tuple[int, int]:
    """Successes and sample scaled down to the independent tries they are worth (at least one)."""
    if not total or not groups:
        return count, total
    design_effect = 1 + (total / groups - 1) * icc
    return round(count / design_effect), max(1, round(total / design_effect))
