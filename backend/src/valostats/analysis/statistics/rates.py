"""Counting helpers used by every analysis."""

from collections.abc import Callable, Iterable

from valostats.schemas.common import Rate


def rate[T](rows: Iterable[T], success: Callable[[T], object]) -> Rate:
    """Share of rows for which `success` is truthy."""
    count = total = 0
    for row in rows:
        total += 1
        count += bool(success(row))
    return Rate(count=count, total=total)
