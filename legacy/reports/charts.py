"""Inline SVG/HTML chart components, tab and tooltip scripts for the reports."""
from .page import MAPS, esc, to_minimap

CHART_CSS = """
.tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:12px 0}
.tile{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:10px 12px}
.tile .tl{font-size:13px;color:var(--muted)}.tile .tv{font-size:24px;font-weight:600;line-height:1.3}
.tile .td{font-size:12px;color:var(--muted)}.tile .td.good{color:var(--good)}.tile .td.bad{color:var(--bad)}
.tabs{display:flex;flex-wrap:wrap;gap:6px;margin:16px 0;position:sticky;top:0;background:var(--bg);padding:8px 0;z-index:5;border-bottom:1px solid var(--line)}
.tabs button{font:inherit;font-size:14px;border:1px solid var(--line);background:var(--card);color:var(--fg);border-radius:16px;padding:4px 12px;cursor:pointer}
.tabs button[aria-selected="true"]{background:var(--accent);border-color:var(--accent);color:#fff}
.tab[hidden]{display:none}
.tabs.sub{position:static;border-bottom:none;padding:0;margin:8px 0 4px}.tabs.sub button{font-size:13px;padding:2px 10px}
.toc{columns:3 200px;font-size:14px;margin:8px 0 0;padding-left:18px}.toc li{margin:2px 0}
h2{scroll-margin-top:64px}
table.data{font-size:13px}table.data td,table.data th{padding:5px 8px;white-space:nowrap}
table.data td.num,table.data th.num{text-align:right;font-variant-numeric:tabular-nums}
td.heat{text-align:right;font-variant-numeric:tabular-nums}
td.v-good{color:var(--good);font-weight:600}td.v-bad{color:var(--bad);font-weight:600}
.bar{display:inline-block;position:relative;width:70px;height:8px;background:var(--mid);border-radius:4px;vertical-align:middle;margin-left:6px}
.bar i{position:absolute;left:0;top:0;bottom:0;background:var(--accent);border-radius:0 4px 4px 0}
.bar b{position:absolute;left:50%;top:-2px;bottom:-2px;width:1px;background:var(--faint)}
.chart{width:100%;height:auto;display:block}.chart .grid{stroke:var(--line);stroke-width:1}.chart .axis{fill:var(--faint);font-size:11px}
.chart .ref{stroke:var(--axis);stroke-width:1}.chart .line{fill:none;stroke:var(--accent);stroke-width:2;stroke-linejoin:round;stroke-linecap:round}
.chart .dot{fill:var(--faint);stroke:var(--card);stroke-width:2}.chart .hit{fill:transparent}
.maps{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}
.mapcard{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:8px}
.mapcard .cap{font-size:13px;margin:4px 2px}.duelmap{width:100%;height:auto;background:#0b0b0b;border-radius:6px;display:block}
.duelmap .won{fill:var(--good-mark);stroke:#0b0b0b;stroke-width:1.5}.duelmap .lost{fill:var(--bad);stroke:#0b0b0b;stroke-width:1.5}
.key{display:inline-flex;align-items:center;gap:4px;margin-right:12px;font-size:13px;color:var(--muted)}
.key i{width:9px;height:9px;border-radius:50%;display:inline-block}
#tip{position:fixed;pointer-events:none;background:var(--card);color:var(--fg);border:1px solid var(--line);border-radius:6px;padding:4px 8px;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,.15);display:none;z-index:10;max-width:280px}
.col.wide{flex-basis:480px}.under{color:var(--bad);font-weight:600}
@media print{.tabs{display:none}.tab[hidden]{display:block!important}.card,.point,.mapcard,tr{break-inside:avoid}
body{background:#fff}#tip{display:none!important}}
.glossary dt{font-weight:600;margin-top:8px}.glossary dd{margin:0 0 0 0;color:var(--muted);font-size:14px}
"""

# Tabs switch sections in place; any element with data-tip shows its text in a floating tooltip (also on focus).
SCRIPT = """
function openTab(id){const b=document.querySelector(`.tabs button[data-tab="${id}"]`);if(!b)return;
 const group=b.closest('.tab');if(group)openTab(group.id);
 const nav=b.closest('nav');nav.querySelectorAll('button').forEach(x=>x.setAttribute('aria-selected',x===b));
 nav.parentElement.querySelectorAll(':scope > .tab').forEach(t=>t.hidden=t.id!==id);}
document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>{openTab(b.dataset.tab);window.scrollTo({top:0});}));
if(location.hash)openTab(location.hash.slice(1));
const tip=document.createElement('div');tip.id='tip';document.body.appendChild(tip);
function show(e,el){tip.textContent=el.dataset.tip;tip.style.display='block';
 const r=el.getBoundingClientRect(),x=e&&e.clientX?e.clientX:r.left+r.width/2,y=e&&e.clientY?e.clientY:r.top;
 tip.style.left=Math.min(x+12,innerWidth-tip.offsetWidth-8)+'px';tip.style.top=(y-tip.offsetHeight-10)+'px';}
document.querySelectorAll('[data-tip]').forEach(el=>{el.addEventListener('pointermove',e=>show(e,el));
 el.addEventListener('pointerleave',()=>tip.style.display='none');el.addEventListener('focus',()=>show(null,el));
 el.addEventListener('blur',()=>tip.style.display='none');});
"""


def pct(k, n):
    return f"{round(100 * k / n)} %" if n else "-"


def tile(label, value, delta=None, tone=""):
    """Stat tile: label, value, optional delta line coloured by whether the change is good."""
    d = f'<div class="td {tone}">{esc(delta)}</div>' if delta else ""
    return f'<div class="tile"><div class="tl">{esc(label)}</div><div class="tv">{esc(value)}</div>{d}</div>'


def tiles(items):
    return f'<div class="tiles">{"".join(items)}</div>'


def rate_bar(k, n):
    """Percentage with a small bar against a 50 % tick."""
    if not n:
        return "-"
    w = round(100 * k / n)
    return f'{w} %<span class="bar" aria-hidden="true"><i style="width:{w}%"></i><b></b></span>'


def heat(k, n, center=0.5, span=0.3, min_n=5, tip=""):
    """Table cell shaded on a diverging scale around `center`; numbers stay in ink."""
    if n < min_n:
        return f'<td class="heat muted" data-tip="{esc(tip or f"{k}/{n}")}" tabindex="0">{pct(k, n) if n else "-"}</td>'
    d = max(-1, min(1, (k / n - center) / span))
    color = "var(--pos)" if d >= 0 else "var(--neg)"
    return (f'<td class="heat" style="background:color-mix(in srgb,{color} {round(abs(d) * 45)}%,transparent)" '
            f'data-tip="{esc(tip or f"{k}/{n}")}" tabindex="0">{pct(k, n)}</td>')


def table(headers, rows, numeric_from=1):
    """Plain data table; columns from `numeric_from` are right-aligned. Cells may already be <td> markup."""
    head = "".join(f'<th class="{"num" if i >= numeric_from else ""}">{esc(h)}</th>' for i, h in enumerate(headers))
    body = []
    for row in rows:
        cells = []
        for i, c in enumerate(row):
            c = str(c)
            cells.append(c if c.startswith("<td") else f'<td class="{"num" if i >= numeric_from else ""}">{c}</td>')
        body.append(f"<tr>{''.join(cells)}</tr>")
    return f'<div class="table-wrap"><table class="data"><tr>{head}</tr>{"".join(body)}</table></div>'


def form_chart(points, window=5, width=720, height=200, y_max=1.0, ref=0.5, unit="%", label="Rounds gagnés par match"):
    """Value per match (dots) with a rolling average line, y from 0 to y_max with a reference line."""
    if not points:
        return ""
    left, right, top, bottom = 36, 10, 10, 24
    pw, ph = width - left - right, height - top - bottom
    x = lambda i: left + (pw * i / max(1, len(points) - 1))
    y = lambda v: top + ph * (1 - min(v, y_max) / y_max)
    tick = lambda v: f"{round(v * 100)}%" if unit == "%" else f"{v:.0f}"
    out = [f'<svg class="chart" viewBox="0 0 {width} {height}" role="img" aria-label="{esc(label)}">']
    for i in range(5):
        v = y_max * i / 4
        out.append(f'<line class="grid" x1="{left}" x2="{width - right}" y1="{y(v):.1f}" y2="{y(v):.1f}"/>'
                   f'<text class="axis" x="{left - 6}" y="{y(v) + 4:.1f}" text-anchor="end">{tick(v)}</text>')
    if ref is not None:
        out.append(f'<line class="ref" x1="{left}" x2="{width - right}" y1="{y(ref):.1f}" y2="{y(ref):.1f}"/>')
    rolling = []
    for i in range(len(points)):
        chunk = [p[1] for p in points[max(0, i - window + 1): i + 1]]
        rolling.append(sum(chunk) / len(chunk))
    out.append('<polyline class="line" points="' + " ".join(f"{x(i):.1f},{y(v):.1f}" for i, v in enumerate(rolling)) + '"/>')
    for i, (label, v, tip) in enumerate(points):
        out.append(f'<circle class="dot" cx="{x(i):.1f}" cy="{y(v):.1f}" r="4"/>'
                   f'<circle class="hit" cx="{x(i):.1f}" cy="{y(v):.1f}" r="12" data-tip="{esc(tip)}" tabindex="0"/>')
    for i in (0, len(points) - 1):
        out.append(f'<text class="axis" x="{x(i):.1f}" y="{height - 6}" text-anchor="{"start" if i == 0 else "end"}">{esc(points[i][0])}</text>')
    return "".join(out) + "</svg>"


def duel_map(map_name, won, lost, size=300):
    """Minimap with opening duels: won (first blood, at the killer) and lost (first death, at the victim)."""
    parts = [f'<svg class="duelmap" viewBox="0 0 {size} {size}" role="img" aria-label="Duels d\'ouverture sur {esc(map_name)}">',
             f'<image href="{MAPS[map_name]["displayIcon"]}" x="0" y="0" width="{size}" height="{size}" opacity="0.7"/>']
    for cls, locs in (("lost", lost), ("won", won)):
        for loc in locs:
            x, y = to_minimap(map_name, loc, size)
            parts.append(f'<circle class="{cls}" cx="{x:.1f}" cy="{y:.1f}" r="4"/>')
    return "".join(parts) + "</svg>"


DUEL_KEY = ('<span class="key"><i style="background:var(--good-mark)"></i>first blood (position du tueur)</span>'
            '<span class="key"><i style="background:var(--bad)"></i>first death (position de la victime)</span>')
