"""Download Henrik v4 match details for the squad 5-stacks listed in data/squad_matches.csv."""
import csv
import json
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).parent
RAW = ROOT / "data" / "raw"
ENV = Path("/home/thomas/projets/valoquests/backend/.env")
URL = "https://api.henrikdev.xyz/valorant/v4/match/eu/{}"
# Quota is shared with ValoQuests, so stay well below 30 req/min.
DELAY_S = 3.5


def api_key():
    for line in ENV.read_text().splitlines():
        if line.startswith("HENRIK_API_KEY="):
            return line.split("=", 1)[1].strip()
    raise SystemExit("HENRIK_API_KEY not found")


def fetch(match_id, key):
    req = urllib.request.Request(URL.format(match_id), headers={"Authorization": key, "User-Agent": "ai-valorant-poc"})
    while True:
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.load(resp)
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = int(e.headers.get("x-ratelimit-reset", "30")) + 2
                print(f"429, waiting {wait}s", flush=True)
                time.sleep(wait)
            elif e.code >= 500:
                time.sleep(30)
            else:
                print(f"{match_id}: HTTP {e.code}", flush=True)
                return None


def main():
    RAW.mkdir(parents=True, exist_ok=True)
    key = api_key()
    ids = [row[0] for row in csv.reader(open(ROOT / "data" / "squad_matches.csv"))]
    for i, match_id in enumerate(ids, 1):
        out = RAW / f"{match_id}.json"
        if out.exists():
            continue
        data = fetch(match_id, key)
        if data and "data" in data:
            out.write_text(json.dumps(data["data"]))
            print(f"{i}/{len(ids)} {match_id}", flush=True)
        time.sleep(DELAY_S)


if __name__ == "__main__":
    main()
