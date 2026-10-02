"""HenrikDev API endpoints and pacing."""

BASE_URL = "https://api.henrikdev.xyz"
MATCH_PATH = "/valorant/v4/match/{region}/{match_id}"
PLAYER_HISTORY_PATH = "/valorant/v4/by-puuid/matches/{region}/pc/{puuid}"
LEADERBOARD_PATH = "/valorant/v3/leaderboard/{region}/pc"

SQUAD_REGION = "eu"
TOP_REGIONS = ("eu", "na", "ap", "kr", "br", "latam")

# The key is shared with ValoQuests (30 req/min), so the squad sync stays well below it.
SQUAD_REQUEST_DELAY_S = 3.5
# The weekly top ranked collection runs alone and may use almost the whole quota.
TOP_REQUEST_DELAY_S = 2.1

# Retry policy for rate limits (429) and server errors (5xx).
MAX_ATTEMPTS = 20
SERVER_ERROR_WAIT_S = 30
DEFAULT_RATE_LIMIT_WAIT_S = 30
REQUEST_TIMEOUT_S = 60

# Recent history fetched for each squad player, to catch 5-stacks ValoQuests has not imported yet.
SQUAD_HISTORY_SIZE = 10

# Top ranked collection: first visible players of each leaderboard, matches of the last days.
TOP_PLAYERS_PER_REGION = 20
TOP_LEADERBOARD_SIZE = 40
TOP_WINDOW_DAYS = 7
TOP_HISTORY_PAGE_SIZE = 10
