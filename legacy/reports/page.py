"""HTML page shell, minimap drawing and French text helpers shared by the reports."""
import html

from .facts import MAPS

CSS = """
:root{--bg:#f9f9f7;--card:#fcfcfb;--fg:#0b0b0b;--muted:#52514e;--faint:#898781;--line:#e1e0d9;--axis:#c3c2b7;--squad:#2a78d6;--opp:#eb6834;--accent:#2a78d6;--good:#006300;--good-mark:#0ca30c;--bad:#d03b3b;--mid:#f0efec;--pos:#2a78d6;--neg:#e34948}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#0d0d0d;--card:#1a1a19;--fg:#fff;--muted:#c3c2b7;--faint:#898781;--line:#2c2c2a;--axis:#383835;--squad:#3987e5;--opp:#d95926;--accent:#3987e5;--good:#0ca30c;--good-mark:#0ca30c;--bad:#e66767;--mid:#383835;--pos:#3987e5;--neg:#e66767}}
:root[data-theme="dark"]{--bg:#0d0d0d;--card:#1a1a19;--fg:#fff;--muted:#c3c2b7;--faint:#898781;--line:#2c2c2a;--axis:#383835;--squad:#3987e5;--opp:#d95926;--accent:#3987e5;--good:#0ca30c;--good-mark:#0ca30c;--bad:#e66767;--mid:#383835;--pos:#3987e5;--neg:#e66767}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,sans-serif}
main{max-width:1120px;margin:0 auto;padding:24px 16px}
h1{font-size:24px;margin:0 0 4px}h2{font-size:20px;margin:32px 0 8px;border-bottom:1px solid var(--line);padding-bottom:4px}
h3{font-size:15px;margin:16px 0 6px;color:var(--accent)}.muted{color:var(--muted)}a{color:var(--accent)}
ul{padding-left:18px;margin:4px 0}li{margin:4px 0}
.card{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:12px;margin:10px 0}
.round{display:flex;gap:14px;flex-wrap:wrap}.round .txt{flex:1 1 300px;min-width:0}.small{font-size:13px;color:var(--muted)}
.tag{display:inline-block;font-size:12px;padding:0 6px;border-radius:4px;border:1px solid var(--line);color:var(--muted);margin-left:6px}
.good{color:var(--good)}.bad{color:var(--bad)}
.table-wrap{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:14px}
th,td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line)}th{color:var(--muted);font-weight:600}
.map{max-width:100%;height:auto;background:#0b0b0b;border-radius:6px}.shot{stroke:#f2c14e;stroke-width:2}
circle.squad{fill:var(--squad);stroke:#fff;stroke-width:1}circle.opp{fill:var(--opp);stroke:#fff;stroke-width:1}
.victim{stroke-width:3}.victim.squad{stroke:var(--squad)}.victim.opp{stroke:var(--opp)}
.label{font-size:10px;fill:#fff;paint-order:stroke;stroke:#000;stroke-width:2px}
.results{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 16px}
.result{padding:4px 10px;border-radius:6px;border:1px solid var(--line);background:var(--card);font-weight:600}
.result.win{border-color:var(--good);color:var(--good)}.result.loss{border-color:var(--bad);color:var(--bad)}
.summary{border-left:4px solid var(--accent)}.summary h3{margin-top:0}
.chip{display:inline-block;font-size:12px;padding:1px 8px;border-radius:10px;background:var(--line);color:var(--fg);margin-right:8px;vertical-align:1px}
.cols{display:flex;flex-wrap:wrap;gap:16px}.col{flex:1 1 320px;min-width:0}
ul.points{list-style:none;padding:0;margin:0}
.point{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--line);border-radius:6px;padding:8px 10px;margin:6px 0}
.point.bad{border-left-color:var(--bad)}.point.good{border-left-color:var(--good)}
.point .detail{display:block;font-size:13px;color:var(--muted);margin-top:2px}
.point.good strong{color:var(--good)}.point.bad strong{color:var(--bad)}
.stats{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 16px}
.throw{display:flex;gap:16px;flex-wrap:wrap}.throw .txt{flex:1 1 320px;min-width:0}
.throw-head{display:flex;align-items:center;gap:4px;margin-bottom:6px}.rnum{font-size:20px;font-weight:700;margin-right:8px}
.headline{font-size:17px;font-weight:700;margin:2px 0 6px;color:var(--bad)}.why{margin:4px 0}
ul.notes{margin:6px 0 8px}details{margin:6px 0}summary{cursor:pointer;color:var(--accent);font-size:14px}
table.timeline{font-size:13px;width:100%}table.timeline td{padding:4px 6px}
table.timeline .t,table.timeline .st{color:var(--muted);white-space:nowrap;font-variant-numeric:tabular-nums}
.kind{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.03em}
tr.death .kind{color:var(--bad)}tr.kill .kind{color:var(--good)}tr.plant .kind{color:var(--accent)}
tr.turning td{background:color-mix(in srgb,var(--bad) 12%,transparent);font-weight:600}
"""

IN_SIDE = {"att": "en attaque", "def": "en défense"}
BUY_FR = {"pistol": "pistol round", "eco": "eco", "force": "force buy", "full": "full buy"}
NUM_FR = {2: "deux", 3: "trois", 4: "quatre", 5: "cinq"}


def page(title, body, extra_css="", script=""):
    return (f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            f"<title>{html.escape(title)}</title><style>{CSS}{extra_css}</style></head><body><main>{body}</main>"
            f"{f'<script>{script}</script>' if script else ''}</body></html>")


def esc(text):
    return html.escape(str(text))


def pct(k, n):
    return f"{round(100 * k / n)} %" if n else "-"


def join_fr(parts):
    parts = list(parts)
    return parts[0] if len(parts) == 1 else ", ".join(parts[:-1]) + " et " + parts[-1]


def rounds_fr(nums):
    nums = [str(n) for n in nums]
    return f"au round {nums[0]}" if len(nums) == 1 else f"aux rounds {join_fr(nums)}"


def de_fr(name):
    return f"d'{name}" if name[:1].lower() in "aeiouyh" else f"de {name}"


def avenged_fr(k, n):
    if n == 1:
        return "Revenge prise." if k else "Pas de revenge."
    if k == 0:
        return "Aucune revenge."
    return "Une seule revenge." if k == 1 else f"{k} revenges sur {n}."


def round_ref(row):
    """Short pointer to a round for rewatching, e.g. '30/09 Split R14'."""
    return f"{row['date']:%d/%m} {row['map']} R{row['round'] + 1}"


def point(chips, title, details, tone=""):
    """A finding card: scope chips, bold title, muted detail lines; tone is good, bad or empty."""
    chips_html = "".join(f'<span class="chip">{esc(c)}</span>' for c in chips)
    details_html = "".join(f'<span class="detail">{esc(d)}</span>' for d in details if d)
    return f'<li class="point {tone}">{chips_html}<strong>{esc(title)}</strong>{details_html}</li>'


def points(items, empty):
    return f'<ul class="points">{"".join(items)}</ul>' if items else f'<p class="muted">{esc(empty)}</p>'


def to_minimap(map_name, loc, size):
    # valorant-api convention: game y drives image x, game x drives image y.
    m = MAPS[map_name]
    return (loc["y"] * m["xMultiplier"] + m["xScalarToAdd"]) * size, (loc["x"] * m["yMultiplier"] + m["yScalarToAdd"]) * size


def svg_kill(map_name, kill, squad_team, size=360):
    """Minimap with every player alive at the given kill; the victim is a cross at the kill location."""
    parts = [f'<svg viewBox="0 0 {size} {size}" width="{size}" height="{size}" class="map" role="img" aria-label="Positions au moment du kill">',
             f'<image href="{MAPS[map_name]["displayIcon"]}" x="0" y="0" width="{size}" height="{size}" opacity="0.75"/>']
    pos = {p["player"]["puuid"]: (p["player"], p["location"]) for p in kill["player_locations"]}
    vx, vy = to_minimap(map_name, kill["location"], size)
    if kill["killer"]["puuid"] in pos:
        kx, ky = to_minimap(map_name, pos[kill["killer"]["puuid"]][1], size)
        parts.append(f'<line x1="{kx:.1f}" y1="{ky:.1f}" x2="{vx:.1f}" y2="{vy:.1f}" class="shot"/>')
    for player, loc in pos.values():
        x, y = to_minimap(map_name, loc, size)
        cls = "squad" if player["team"] == squad_team else "opp"
        parts.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="5" class="{cls}"/>')
        if cls == "squad":
            parts.append(f'<text x="{x + 7:.1f}" y="{y + 4:.1f}" class="label">{esc(player["name"])}</text>')
    cls = "squad" if kill["victim"]["team"] == squad_team else "opp"
    parts.append(f'<path d="M{vx - 5:.1f},{vy - 5:.1f}L{vx + 5:.1f},{vy + 5:.1f}M{vx - 5:.1f},{vy + 5:.1f}L{vx + 5:.1f},{vy - 5:.1f}" class="victim {cls}"/>')
    return "".join(parts) + "</svg>"


MAP_LEGEND = ('<p class="small">Sur les cartes : <span class="key"><i style="background:var(--squad)"></i>vos joueurs</span>'
              '<span class="key"><i style="background:var(--opp)"></i>les adversaires</span>La croix marque le joueur tué, '
              'le trait jaune relie le tueur à sa victime.</p>')
