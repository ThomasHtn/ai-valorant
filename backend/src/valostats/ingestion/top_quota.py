"""Quotas of the top ranked collection: matches kept per map for the current patch, EU first."""

from collections import Counter
from dataclasses import dataclass, field

from sqlalchemy.orm import Session

from valostats.constants.top_collection import EU_REGION, EU_SHARE, MATCHES_PER_MAP
from valostats.domain.enums import MatchSource
from valostats.domain.patches import patch_sort_key
from valostats.repositories import match_repository

# Matches of other regions a map may hold: they only fill what EU leaves.
OTHERS_PER_MAP = round(MATCHES_PER_MAP * (1 - EU_SHARE))


@dataclass
class TopQuota:
    # Newest patch stored or seen; older patches are not collected any more.
    patch: str | None
    stored: Counter[str] = field(default_factory=Counter)
    others: Counter[str] = field(default_factory=Counter)

    @classmethod
    def load(cls, session: Session) -> "TopQuota":
        patches = match_repository.patches(session, MatchSource.TOP)
        if not patches:
            return cls(patch=None)
        patch = max(patches, key=patch_sort_key)
        quota = cls(patch=patch)
        for map_name, region, n in match_repository.count_by_map_and_region(session, MatchSource.TOP, patch):
            quota.stored[map_name] += n
            if region != EU_REGION:
                quota.others[map_name] += n
        return quota

    def see(self, patch: str) -> None:
        """A newer patch opens a fresh quota."""
        if self.patch is None or patch_sort_key(patch) > patch_sort_key(self.patch):
            self.patch = patch
            self.stored.clear()
            self.others.clear()

    def accepts(self, patch: str, map_name: str, region: str) -> bool:
        if patch != self.patch or self.stored[map_name] >= MATCHES_PER_MAP:
            return False
        return region == EU_REGION or self.others[map_name] < OTHERS_PER_MAP

    def add(self, map_name: str, region: str) -> None:
        self.stored[map_name] += 1
        if region != EU_REGION:
            self.others[map_name] += 1

    def full(self, pool: frozenset[str], region: str) -> bool:
        """Whether no pool map can take a match of this region any more."""
        patch = self.patch
        return bool(pool) and patch is not None and not any(self.accepts(patch, m, region) for m in pool)
