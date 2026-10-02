"""Thresholds of the statistical analysis; changing one changes what the reports flag."""

from datetime import timedelta

# False discovery rate of the Benjamini-Hochberg correction.
FDR_Q = 0.10
# p-value under which an uncorrected gap is still shown, as a "lead".
LEAD_P_VALUE = 0.05

# Minimum sample on each side of a squad vs opponents comparison.
MIN_COMPARISON_SAMPLE = 15
# Below this many matches in the previous period, the whole history before is used instead.
MIN_PREVIOUS_MATCHES = 5
# Rounds a player needs in the period to get a profile.
MIN_PLAYER_ROUNDS = 40
# Matches on a map before it gets duel maps or per-map cards.
MIN_MAP_MATCHES = 3
# Top ranked matches on a map before they serve as reference for it.
MIN_TOP_MAP_MATCHES = 10
# Top ranked rounds before a per-site or per-map rate is trusted as reference.
MIN_TOP_REFERENCE_ROUNDS = 20

# Rewatch links shown per finding, and findings per metric in the team list.
MAX_REWATCH_REFS = 6
MAX_FINDINGS_PER_METRIC = 2

# Evenings: a new session starts after this gap between two matches.
SESSION_GAP = timedelta(hours=3)
# Matches on a map and side before the session compares tonight with the squad's habits.
MIN_SESSION_HISTORY = 8
# A lost round only counts as a throw if the squad's chance to win went at least this high.
THROW_MIN_WIN_CHANCE = 0.65
# Costly rounds kept per match in the session report.
MAX_COSTLY_ROUNDS = 3

# A death within this time is an early death.
EARLY_DEATH_MS = 25_000
# Pearson correlations need at least this many matches.
MIN_CORRELATION_MATCHES = 8
# Numerical advantage that makes a lost round a throw, and disadvantage that makes a won one a comeback.
THROW_ADVANTAGE = 2
