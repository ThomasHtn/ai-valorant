"""Valorant game rules the analysis relies on."""

# In-game team identifiers used by Henrik.
RED = "Red"
BLUE = "Blue"
TEAMS = (RED, BLUE)

# Players per team; a squad match needs the whole squad on one team.
TEAM_SIZE = 5

# Rounds 1 and 13 (0-based 0 and 12) start with a fresh economy.
PISTOL_ROUNDS = (0, 12)
HALF_LENGTH = 12
OVERTIME_START = 24

# A death is avenged ("revenge") when a teammate kills the killer within this window.
REVENGE_WINDOW_MS = 3000

# Average team loadout thresholds, calibrated on the real distribution of buys.
FULL_BUY_MIN_LOADOUT = 3700
ECO_MAX_LOADOUT = 1500

# Every date shown to the squad is in their time zone.
LOCAL_TIMEZONE = "Europe/Paris"
