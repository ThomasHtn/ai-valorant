"""Local data: squad match list from the ValoQuests database, Henrik match details, map metadata."""
import csv
import json
import os
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
RAW = DATA / "raw"
OUT = ROOT / "out"
VALOQUESTS_ENV = Path("/home/thomas/projets/valoquests/backend/.env")
HENRIK_MATCH_URL = "https://api.henrikdev.xyz/valorant/v4/match/eu/{}"
HENRIK_HISTORY_URL = "https://api.henrikdev.xyz/valorant/v4/by-puuid/matches/eu/pc/{}?mode=competitive&size=10"
MAPS_URL = "https://valorant-api.com/v1/maps"
# Quota is shared with ValoQuests, so stay well below 30 req/min.
HENRIK_DELAY_S = 3.5

SQUAD_QUERY = "select riot_puuid, game_name from player where status = 'ACTIVE'"
MATCHES_QUERY = """
select m.external_match_id, m.started_at, m.map_name
from valorant_match m join player_match pm on pm.match_id = m.id
where m.queue_id = 'competitive'
group by 1, 2, 3 having count(*) >= 5 order by 2
"""


def env(path=VALOQUESTS_ENV):
    values = {}
    for line in path.read_text().splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip()
    return values


def export_csv(query, target, cfg):
    host_port_db = cfg["DB_URL"].split("//", 1)[1]
    host_port, db = host_port_db.split("/", 1)
    host, _, port = host_port.partition(":")
    result = subprocess.run(
        ["psql", "-h", host, "-p", port or "5432", "-U", cfg["DB_USERNAME"], "-d", db, "-At", "-F,", "-c", query],
        env={**os.environ, "PGPASSWORD": cfg["DB_PASSWORD"]}, capture_output=True, text=True, check=True,
    )
    target.write_text(result.stdout)


def henrik_get(url, key):
    """GET a Henrik endpoint, waiting on rate limits and server errors; returns the 'data' field or None."""
    req = urllib.request.Request(url, headers={"Authorization": key, "User-Agent": "ai-valorant"})
    for _ in range(20):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                return json.load(resp).get("data")
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(int(e.headers.get("x-ratelimit-reset", "30")) + 2)
            elif e.code >= 500:
                time.sleep(30)
            else:
                print(f"{url}: HTTP {e.code}, skipped")
                return None
        except (urllib.error.URLError, TimeoutError):
            time.sleep(30)
    return None


def fetch_match(match_id, key):
    return henrik_get(HENRIK_MATCH_URL.format(match_id), key)


def sync_recent(cfg):
    """Last 10 competitive matches of each squad player straight from Henrik, keeping new 5-stacks (ValoQuests may lag or be down)."""
    squad = load_squad()
    added = 0
    for puuid in squad:
        for m in henrik_get(HENRIK_HISTORY_URL.format(puuid), cfg["HENRIK_API_KEY"]) or []:
            path = RAW / f"{m['metadata']['match_id']}.json"
            teams = [p["team_id"] for p in m["players"] if p["puuid"] in squad]
            if not path.exists() and teams and max(teams.count(t) for t in set(teams)) >= 5:
                path.write_text(json.dumps(m))
                added += 1
        time.sleep(HENRIK_DELAY_S)
    print(f"{added} new 5-stack(s) found in the players' Henrik history")


def sync():
    """Refresh the squad and 5-stack lists from ValoQuests, then download missing match details."""
    cfg = env()
    DATA.mkdir(exist_ok=True)
    RAW.mkdir(exist_ok=True)
    export_csv(SQUAD_QUERY, DATA / "squad.csv", cfg)
    export_csv(MATCHES_QUERY, DATA / "squad_matches.csv", cfg)
    if not (DATA / "maps.json").exists():
        urllib.request.urlretrieve(MAPS_URL, DATA / "maps.json")
    missing = [row[0] for row in csv.reader(open(DATA / "squad_matches.csv")) if not (RAW / f"{row[0]}.json").exists()]
    print(f"{len(missing)} match(es) to download")
    for i, match_id in enumerate(missing, 1):
        data = fetch_match(match_id, cfg["HENRIK_API_KEY"])
        if data:
            (RAW / f"{match_id}.json").write_text(json.dumps(data))
            print(f"{i}/{len(missing)} {match_id}")
        time.sleep(HENRIK_DELAY_S)
    sync_recent(cfg)


def load_squad():
    return {row[0]: row[1] for row in csv.reader(open(DATA / "squad.csv"))}


def load_matches():
    """All downloaded matches, oldest first."""
    matches = [json.load(open(p)) for p in RAW.glob("*.json")]
    return sorted(matches, key=lambda m: m["metadata"]["started_at"])


def load_maps():
    return {m["displayName"]: m for m in json.load(open(DATA / "maps.json"))["data"] if m.get("callouts")}
