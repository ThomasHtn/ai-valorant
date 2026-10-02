"""Top ranked collection: top 10 of each region's leaderboard, their competitive matches of the last 7 days."""
import gzip
import json
import pickle
from collections import Counter
from datetime import datetime, timedelta, timezone

import time

from .data import DATA, env, henrik_get
from .facts import extract, player_rounds

TOP = DATA / "top"
TOP_RAW = TOP / "raw"
REGIONS = ["eu", "na", "ap", "kr", "br", "latam"]
TOP_N = 20
DAYS = 7
PAGE = 10
# About 28 req/min, just under the 30/min key limit; ValoQuests sync is allowed to lag meanwhile.
TOP_DELAY_S = 2.1
LEADERBOARD_URL = "https://api.henrikdev.xyz/valorant/v3/leaderboard/{region}/pc?size=40"
MATCHES_URL = "https://api.henrikdev.xyz/valorant/v4/by-puuid/matches/{region}/pc/{puuid}?mode=competitive&size={size}&start={start}"


def started_utc(match):
    return datetime.fromisoformat(match["metadata"]["started_at"].replace("Z", "+00:00"))


def top_players(region, key):
    """First TOP_N visible players of the leaderboard; anonymized or banned ones are replaced by the next."""
    data = henrik_get(LEADERBOARD_URL.format(region=region), key)
    if not data:
        return []
    (TOP / "leaderboards").mkdir(parents=True, exist_ok=True)
    (TOP / "leaderboards" / f"{datetime.now():%Y-%m-%d}_{region}.json").write_text(json.dumps(data))
    visible = [p for p in data["players"] if p["puuid"] and not p["is_anonymized"] and not p["is_banned"]]
    return visible[:TOP_N]


def sync_top():
    """Download the last 7 days of competitive matches of every region's top 10, skipping matches already stored."""
    key = env()["HENRIK_API_KEY"]
    TOP_RAW.mkdir(parents=True, exist_ok=True)
    since = datetime.now(timezone.utc) - timedelta(days=DAYS)
    created = set()
    for region in REGIONS:
        players = top_players(region, key)
        time.sleep(TOP_DELAY_S)
        new = 0
        for p in players:
            start = 0
            while True:
                page = henrik_get(MATCHES_URL.format(region=region, puuid=p["puuid"], size=PAGE, start=start), key) or []
                time.sleep(TOP_DELAY_S)
                fresh = [m for m in page if started_utc(m) >= since]
                from_previous_run = 0
                for m in fresh:
                    match_id = m["metadata"]["match_id"]
                    path = TOP_RAW / f"{match_id}.json.gz"
                    if not path.exists():
                        with gzip.open(path, "wt") as f:
                            json.dump(m, f)
                        created.add(match_id)
                        new += 1
                    elif match_id not in created:
                        from_previous_run += 1
                # Stop at the end of the history, past the window, or where the previous run left off
                # (matches stored earlier in this run come from a duo partner and do not count).
                if len(page) < PAGE or len(fresh) < len(page) or from_previous_run == len(page):
                    break
                start += PAGE
        print(f"{region}: {len(players)} players, {new} new matches")


def load_top_matches():
    matches = []
    for path in TOP_RAW.glob("*.json.gz"):
        with gzip.open(path, "rt") as f:
            matches.append(json.load(f))
    return sorted(matches, key=lambda m: m["metadata"]["started_at"])


def top_facts():
    """Round, death and player facts of the top ranked matches, cached until new matches are stored."""
    files = list(TOP_RAW.glob("*.json.gz"))
    signature = (len(files), max((f.stat().st_mtime for f in files), default=0))
    cache = TOP / "facts.pkl"
    if cache.exists():
        with open(cache, "rb") as f:
            cached = pickle.load(f)
        if cached["signature"] == signature:
            return cached
    matches = load_top_matches()
    rounds, deaths = extract(matches)
    players, player_matches = player_rounds(matches)
    cached = {"signature": signature, "matches": len(matches), "rounds": rounds, "deaths": deaths,
              "players": players, "player_matches": player_matches}
    with open(cache, "wb") as f:
        pickle.dump(cached, f)
    return cached


def status():
    """Volume per map and patch, against the phase 2 target of several hundred matches per map and patch."""
    matches = load_top_matches()
    rounds, _ = extract(matches)
    per = Counter((m["metadata"]["game_version"].split("-")[1], m["metadata"]["map"]["name"]) for m in matches)
    print(f"{len(matches)} matches, {len(rounds) // 2} rounds")
    for patch in sorted({p for p, _ in per}):
        row = ", ".join(f"{mp} {n}" for (pt, mp), n in sorted(per.items(), key=lambda kv: -kv[1]) if pt == patch)
        print(f"patch {patch}: {row}")
