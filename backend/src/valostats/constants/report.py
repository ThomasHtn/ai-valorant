"""Numbers of the report views: sample minimums, grouping rules, cache sizes.

Colours are decided by the front; these values only say when a sample is too small to be coloured
(sent as each column's `min`) and how facts are grouped.
"""

from datetime import timedelta

# Minimum sample of a team cell (rounds, deaths, duels...) before it gets a colour.
MIN_TEAM_SAMPLE = 20
# Minimum sample of a cell about one player on one map or one agent.
MIN_PLAYER_SAMPLE = 10
# Pistol rounds per map before the pistol rate is coloured (2 per match).
MIN_PISTOL_SAMPLE = 6
# Matches before a per-match average (score difference) is coloured.
MIN_MATCH_SAMPLE = 3

# A team is "less equipped" when its average loadout is this many credits under the opponents'.
CHEAPER_LOADOUT_GAP = 500

# Evenings: a new evening starts after this gap between two matches.
EVENING_GAP = timedelta(hours=3)

# Period computations kept in memory (cohorts and tables of a few megabytes each).
CACHED_PERIODS = 8

# Decimals kept in the JSON for computed values: enough for a percentage to one decimal.
VALUE_DECIMALS = 4

# Top ranked matches the period's own patches need before the reference stops mixing in the other kept patch.
REFERENCE_MIN_MATCHES = 700
# Top ranked matches of a pool map under which its reference is still being collected.
MIN_MAP_REFERENCE = 100
