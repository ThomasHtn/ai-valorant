"""Numbers of the Ouvertures, Combat, Revenge et espacement and Situations domains."""

from valostats.constants.game import UNITS_PER_METRE

# A death is "isolated" when no living teammate stands within this distance (15 m).
ISOLATION_DISTANCE = 15 * UNITS_PER_METRE
# Two deaths of the same team in the same zone within this delay, neither avenged: a "double peek".
DOUBLE_PEEK_MS = 5000

# Advantage (alive players) from which a lost round is a throw and a won one a comeback.
NUMBERS_SWING = 2

# Opening duels: weapons with fewer duels than this (first bloods plus first deaths) are not listed.
MIN_OPENING_WEAPON_DUELS = 5

# Consistency: standard deviation of the per-match ACS, computed from this many matches.
MIN_CONSISTENCY_MATCHES = 3
# Top ranked reference of consistency: players with at least this many matches.
MIN_TOP_CONSISTENCY_MATCHES = 5

# Face-to-face: opponents listed per squad player, most met first.
FACE_TO_FACE_OPPONENTS = 3

# Player cells are coloured from these samples (rounds, deaths, duels, matches).
MIN_PLAYER_ROUNDS = 50
MIN_PLAYER_DEATHS = 30
MIN_PLAYER_DUELS = 10
MIN_PLAYER_EVENTS = 8
MIN_PLAYER_MATCHES = 5
# Map x side cells (about half the sample of a whole map).
MIN_SIDE_SAMPLE = 10
MIN_SIDE_EVENTS = 15
# Situations and clutches.
MIN_SITUATION_SAMPLE = 15
MIN_SITUATION_SIDE_SAMPLE = 10
MIN_CLUTCH_SAMPLE = 10
