"""Numbers of the round-level views: loss causes, round sheets, minimap."""

# A lost round is a thrown lead once the team led by this many players.
LEAD_THROWN_ADVANTAGE = 2

# A lost round is a throw once the squad's chance of winning reached this level.
THROW_MIN_CHANCE = 0.7

# Round sheets kept in memory (each one is built from the raw payload of its match).
CACHED_ROUND_SHEETS = 64
# Match details kept in memory.
CACHED_MATCH_DETAILS = 32

# Deaths linked from each zone of the minimap summary.
MAX_ZONE_REFS = 40

# Cells per side of the grid that sums the top ranked plants on the minimap.
PLANT_GRID_CELLS = 48

# Decimals of minimap coordinates (0..1) and of win probabilities in the JSON.
MINIMAP_DECIMALS = 3
PROBABILITY_DECIMALS = 3
