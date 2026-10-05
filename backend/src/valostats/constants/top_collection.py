"""Top ranked collection: quotas, map pool and retention."""

# Matches kept per map and patch; past it the map is full and its new matches are skipped.
MATCHES_PER_MAP = 400
# Share of each map's quota reserved to EU matches: other regions only fill the rest.
EU_SHARE = 0.6
EU_REGION = "eu"

# Patches whose top ranked matches are kept (the current one and the previous one).
KEPT_PATCHES = 2

# A map stays in the competitive pool while it was played this close to the latest top ranked match.
POOL_STALE_DAYS = 3

# Once every pool map is full, only the first EU players are read, to notice a new patch or a pool change.
PROBE_PLAYERS = 10
