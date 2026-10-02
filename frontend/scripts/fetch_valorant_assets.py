"""Download Valorant images from Data Dragon into `public/assets/valorant/`.

Run from the repository root after a game update:

    uv run --with pillow python frontend/scripts/fetch_valorant_assets.py

Files are named by slug (`kayo.webp`, `split-banner.webp`) so the front end can find them from the
names the API returns. Images are resized and saved as WebP to keep the bundle light.
"""

import io
import json
import re
import urllib.request
from pathlib import Path

from PIL import Image

DDRAGON = "https://raw.githubusercontent.com/noxelisdev/Valorant_DDragon/master"
# Data Dragon has no agent roles; valorant-api.com mirrors the same ids with them.
AGENTS_API = "https://valorant-api.com/v1/agents?isPlayableCharacter=true"
OUT = Path(__file__).resolve().parent.parent / "public" / "assets" / "valorant"

# Maps of the competitive pool, past and present; other modes are skipped.
COMPETITIVE_MAPS = {
    "Abyss", "Ascent", "Bind", "Breeze", "Corrode", "Fracture", "Haven", "Icebox",
    "Lotus", "Pearl", "Split", "Summit", "Sunset",
}
# Shop weapons and the knife; event and ability weapons are skipped.
WEAPONS = {
    "Classic", "Shorty", "Frenzy", "Ghost", "Bandit", "Sheriff", "Stinger", "Spectre", "Bucky",
    "Judge", "Bulldog", "Guardian", "Phantom", "Vandal", "Marshal", "Outlaw", "Operator", "Ares",
    "Odin", "Melee",
}

AGENT_SIZE = 128
SPLASH_SIZE = (960, 540)
WEBP_QUALITY = 80


def slug(name: str) -> str:
    """'KAY/O' -> 'kayo', 'The Range' -> 'the-range'."""
    return re.sub(r"[^a-z0-9]+", "-", name.lower().replace("/", "")).strip("-")


def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "valostats-assets"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


def save(data: bytes, target: Path, size: tuple[int, int] | None = None) -> None:
    image = Image.open(io.BytesIO(data))
    if size:
        image.thumbnail(size, Image.Resampling.LANCZOS)
    target.parent.mkdir(parents=True, exist_ok=True)
    image.save(target, "WEBP", quality=WEBP_QUALITY, method=6)
    print(f"{target.relative_to(OUT)} {target.stat().st_size // 1024} KB")


def name_of(entry: dict) -> str:
    return entry["name"]["defaultText"]


def main() -> None:
    catalog = json.loads(fetch(f"{DDRAGON}/PublicContentCatalog.json"))
    roles = {
        agent["uuid"].upper(): agent["role"]["displayName"]
        for agent in json.loads(fetch(AGENTS_API))["data"]
        if agent.get("role")
    }

    agent_roles: dict[str, str] = {}
    for character in catalog["characters"]:
        role = roles.get(character["id"])
        if not role:
            continue  # NPCs and duplicates without a playable role
        agent_roles[name_of(character)] = role
        save(fetch(f"{DDRAGON}/Characters/{character['id']}.png"),
             OUT / "agents" / f"{slug(name_of(character))}.webp", (AGENT_SIZE, AGENT_SIZE))

    for role in catalog["characterRoles"]:
        save(fetch(f"{DDRAGON}/CharacterRoles/{role['id']}.png"),
             OUT / "roles" / f"{slug(name_of(role))}.webp", (64, 64))

    for game_map in catalog["maps"]:
        name = name_of(game_map)
        if name not in COMPETITIVE_MAPS:
            continue
        save(fetch(f"{DDRAGON}/Maps/{game_map['id']}_listview.png"),
             OUT / "maps" / f"{slug(name)}-banner.webp")
        save(fetch(f"{DDRAGON}/Maps/{game_map['id']}_splash.png"),
             OUT / "maps" / f"{slug(name)}-splash.webp", SPLASH_SIZE)

    for weapon in catalog["weapons"]:
        if name_of(weapon) not in WEAPONS:
            continue
        target = OUT / "weapons" / f"{slug(name_of(weapon))}.webp"
        if target.exists():
            continue  # Classic is listed twice
        save(fetch(f"{DDRAGON}/Weapons/{weapon['id']}_killstream.png"), target)

    print(json.dumps(dict(sorted(agent_roles.items())), indent=2))


if __name__ == "__main__":
    main()
