"""Numbers of the Points forts et faibles view, the automatic detections and the insight charts."""

# Squad sample (rounds, deaths, player-rounds) under which a comparison is not tested at all.
MIN_FINDING_SAMPLE = 10
# A finding worth less than this many rounds is dropped: nothing is at stake (e.g. plant timing).
MIN_GAP_ROUNDS = 0.5
# KAST rises with winning (you survive because you won): its measured weight on the round is capped.
KAST_MAX_LEVERAGE = 0.2
# Rounds to rewatch listed per finding or detection.
MAX_REWATCH = 6

# Numbers situations whose conversion is tested, squad alive first.
TESTED_STATES = ("5v4", "4v3", "3v2", "2v1", "1v1", "4v5", "3v4", "2v3", "1v2")
# A plant before this time (ms) is a fast plant.
FAST_PLANT_MS = 30_000

# Repetitions: same zone, cause or situation at least this often, over at least this many matches.
REPETITION_MIN_COUNT = 4
REPETITION_MIN_MATCHES = 2
# A zone is a first death habit only when the squad's share there beats top ranked by this much.
ZONE_EXCESS_MIN_SHARE = 0.05
# Matches a player needs before his ACS is split above / below his median.
ACS_LINK_MIN_MATCHES = 6

# Rounds 2 and 3 of each half (0-based), for the round-after-pistol checks.
SECOND_ROUNDS = (1, 13)
THIRD_ROUNDS = (2, 14)

# Round length estimates when the last event is not the end of the round (ms).
DETONATION_DELAY_MS = 45_000
ROUND_LENGTH_MS = 100_000
