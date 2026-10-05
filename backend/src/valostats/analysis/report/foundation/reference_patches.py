"""Which top ranked patches a period is compared with.

The period's own patches when the top ranked collection holds enough of them, else every kept patch:
right after a patch opens, the previous one fills the gap until the new one catches up.
"""

from collections.abc import Collection, Mapping

from valostats.constants.report import REFERENCE_MIN_MATCHES
from valostats.domain.patches import patch_sort_key


def reference_patches(period_patches: Collection[str], top_matches: Mapping[str, int]) -> tuple[str, ...]:
    """`top_matches` counts the top ranked matches of each kept patch."""
    own = [p for p in top_matches if p in period_patches]
    chosen = own if sum(top_matches[p] for p in own) >= REFERENCE_MIN_MATCHES else list(top_matches)
    return tuple(sorted(chosen, key=patch_sort_key))
