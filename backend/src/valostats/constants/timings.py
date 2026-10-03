"""Time buckets of the Spike and Timings domains (milliseconds since the start of the round)."""

# Plant tempo: fast before 40 s, late after 70 s.
FAST_PLANT_MS = 40_000
LATE_PLANT_MS = 70_000

# Moment of a death: early before 20 s, late after 60 s.
EARLY_DEATH_MS = 20_000
LATE_DEATH_MS = 60_000

# Checkpoints of the "players still alive" table, in seconds.
SURVIVAL_CHECKPOINTS_S = (20, 40, 60, 80)

MS_PER_SECOND = 1000
