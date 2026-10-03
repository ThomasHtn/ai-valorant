"""Distances between positions of a kill snapshot, in game units."""

import math
from collections.abc import Sequence
from itertools import combinations

from valostats.domain.facts import Location


def distance(a: Location, b: Location) -> float:
    return math.dist((a.x, a.y), (b.x, b.y))


def nearest(origin: Location, others: Sequence[Location]) -> float | None:
    """Distance to the closest of `others`, None when there is nobody."""
    return min((distance(origin, o) for o in others), default=None)


def mean_spread(points: Sequence[Location]) -> float | None:
    """Mean distance between every pair of points (how spread out a team is); None under two points."""
    pairs = [distance(a, b) for a, b in combinations(points, 2)]
    return sum(pairs) / len(pairs) if pairs else None
