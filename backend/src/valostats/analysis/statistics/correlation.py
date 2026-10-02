"""Pearson correlation."""

import math
from collections.abc import Sequence

from valostats.constants.analysis import MIN_CORRELATION_MATCHES


def pearson(xs: Sequence[float], ys: Sequence[float]) -> float | None:
    """Correlation coefficient from -1 to 1; None with too few points or no variation."""
    n = len(xs)
    if n < MIN_CORRELATION_MATCHES:
        return None
    mx, my = sum(xs) / n, sum(ys) / n
    sx = math.sqrt(sum((x - mx) ** 2 for x in xs))
    sy = math.sqrt(sum((y - my) ** 2 for y in ys))
    if not sx or not sy:
        return None
    return sum((x - mx) * (y - my) for x, y in zip(xs, ys, strict=True)) / (sx * sy)
