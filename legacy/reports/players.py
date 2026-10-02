"""Individual profiles: per-player stats against same-elo opponents and top ranked players on the same agents."""
import math
from collections import Counter, defaultdict

from .charts import DUEL_KEY, duel_map, form_chart, heat, pct, table, tile, tiles
from .page import esc, points, point
from .stats import one_proportion

MIN_ROUNDS = 40
MIN_MAP_MATCHES = 3

# key, label, kind (mean of a per-round value / rate over a subset), higher is better, format, definition.
STATS = [
    ("acs", "ACS", "mean", True, "{:.0f}", "Score de combat moyen par round (kills, dégâts, multi-kills, assists)."),
    ("kpr", "Kills par round", "mean", True, "{:.2f}", "Nombre moyen de kills par round."),
    ("dpr", "Morts par round", "mean", False, "{:.2f}", "Nombre moyen de morts par round."),
    ("apr", "Assists par round", "mean", True, "{:.2f}", "Nombre moyen d'assists par round."),
    ("adr", "ADR", "mean", True, "{:.0f}", "Dégâts infligés par round."),
    ("kast", "KAST", "rate", True, "{}", "Part des rounds avec un kill, un assist, une survie ou une mort revenge."),
    ("survival", "Survie", "rate", True, "{}", "Part des rounds où le joueur est vivant à la fin."),
    ("hs", "Headshots", "rate", True, "{}", "Part des tirs touchés à la tête."),
    ("fbpr", "First bloods par round", "mean", True, "{:.2f}", "Kills d'ouverture par round."),
    ("fdpr", "First deaths par round", "mean", False, "{:.2f}", "Morts d'ouverture par round."),
    ("opening", "Duels d'ouverture gagnés", "rate", True, "{}", "First bloods / (first bloods + first deaths)."),
    ("revenge_given", "Revenges données par round", "mean", True, "{:.2f}", "Kills qui vengent un coéquipier mort dans les 3 secondes."),
    ("traded", "Morts avec revenge", "rate", True, "{}", "Part de ses morts vengées par un coéquipier dans les 3 secondes."),
    ("zero_dmg", "Morts à 0 dégât", "rate", False, "{}", "Part de ses morts sans avoir infligé de dégâts dans le round."),
    ("multi", "Rounds à 2 kills ou plus", "rate", True, "{}", "Part des rounds avec au moins 2 kills."),
    ("impact", "Impact", "mean", True, "{:+.1f}", "Points de chances de victoire gagnés ou perdus par round, via ses kills, morts et plants."),
]


def values(rows):
    """Per-stat (sum, count, sum of squares) from player-round rows."""
    acc = defaultdict(lambda: [0.0, 0, 0.0])

    def add(key, v, n=1):
        a = acc[key]
        a[0] += v
        a[1] += n
        a[2] += v * v

    for r in rows:
        add("acs", r["score"])
        add("kpr", r["kills"])
        add("dpr", r["deaths"])
        add("apr", r["assists"])
        add("adr", r["damage"])
        add("kast", r["kast"])
        add("survival", r["survived"])
        add("fbpr", r["fb"])
        add("fdpr", r["fd"])
        add("revenge_given", r["revenge_given"])
        add("multi", r["kills"] >= 2)
        add("impact", 100 * r["wpa"])
        shots = r["hs"] + r["bs"] + r["ls"]
        if shots:
            acc["hs"][0] += r["hs"]
            acc["hs"][1] += shots
        if r["fb"] or r["fd"]:
            add("opening", r["fb"])
        if r["deaths"]:
            add("traded", r["traded"])
            add("zero_dmg", r["zero_damage_death"])
    return acc


def mean(acc, key):
    s, n, _ = acc.get(key, (0, 0, 0))
    return s / n if n else None


def test(acc, key, ref, kind):
    """p-value of the player's value against a reference treated as known (large benchmark samples)."""
    s, n, sq = acc.get(key, (0, 0, 0))
    if not n or ref is None:
        return 1.0
    if kind == "rate":
        if not 0 < ref < 1:
            return 1.0
        return one_proportion(round(s), n, ref)
    var = sq / n - (s / n) ** 2
    if n < 2 or var <= 0:
        return 1.0
    return math.erfc(abs(s / n - ref) / math.sqrt(var / n) / math.sqrt(2))


def benchmark_by_agent(top_rows):
    by_agent = defaultdict(list)
    for r in top_rows:
        by_agent[r["agent"]].append(r)
    return {agent: values(rows) for agent, rows in by_agent.items()}


def mixed_benchmark(player_rows, by_agent):
    """Top ranked reference weighted by the player's own agent mix, so a Sova player is compared to Sova players."""
    mix = Counter(r["agent"] for r in player_rows)
    out = {}
    for key, *_ in STATS:
        num = den = 0.0
        for agent, w in mix.items():
            if agent in by_agent and mean(by_agent[agent], key) is not None:
                num += w * mean(by_agent[agent], key)
                den += w
        out[key] = num / den if den else None
    return out


def fmt(key, v):
    if v is None:
        return "-"
    kind, spec = next((kd, f) for k, _, kd, _, f, _ in STATS if k == key)
    return f"{round(100 * v)} %" if kind == "rate" else spec.format(v)


def stat_rows(acc, opp_acc, top_ref):
    """Rows of the main table plus the significant gaps, for strengths and things to work on."""
    rows, gaps = [], []
    for key, label, kind, better, _, definition in STATS:
        v = mean(acc, key)
        o = mean(opp_acc, key)
        t = top_ref.get(key)
        cells = [f'<td data-tip="{esc(definition)}" tabindex="0">{esc(label)}</td>']
        for ref, who in ((o, "opp"), (t, "top")):
            p = test(acc, key, ref, kind)
            if v is not None and ref is not None and p < 0.05:
                good = (v > ref) == better
                gaps.append({"who": who, "key": key, "label": label, "value": v, "ref": ref, "good": good, "p": p,
                             "gap": abs(v - ref) / (abs(ref) or 1)})
        p_opp = test(acc, key, o, kind)
        cls = ""
        if v is not None and o is not None and p_opp < 0.05:
            cls = "v-good" if (v > o) == better else "v-bad"
        cells.append(f'<td class="num {cls}">{fmt(key, v)}</td>')
        cells.append(f'<td class="num">{fmt(key, o)}</td>')
        p_top = test(acc, key, t, kind)
        gap = ""
        if v is not None and t is not None and p_top < 0.05:
            gap = f' <span class="{"good" if (v > t) == better else "bad"}">{"▲" if v > t else "▼"}</span>'
        cells.append(f'<td class="num">{fmt(key, t)}{gap}</td>')
        rows.append(cells)
    return rows, gaps


def split_table(rows, key_fn, label, min_rounds=1, extra=None, with_matches=True):
    """Per side / agent / map breakdown of the key stats."""
    groups = defaultdict(list)
    for r in rows:
        groups[key_fn(r)].append(r)
    out = []
    for name, rs in sorted(groups.items(), key=lambda kv: -len(kv[1])):
        if len(rs) < min_rounds:
            continue
        acc = values(rs)
        matches = {r["match"] for r in rs}
        wins = len({r["match"] for r in rs if r["match_won"]})
        kills, deaths = sum(r["kills"] for r in rs), sum(r["deaths"] for r in rs)
        row = [esc(name)] + ([len(matches), f"{wins}-{len(matches) - wins}"] if with_matches else []) + [len(rs), fmt("acs", mean(acc, "acs")),
               f"{kills / deaths:.2f}" if deaths else "-", fmt("adr", mean(acc, "adr")), fmt("kast", mean(acc, "kast")),
               f'{sum(r["fb"] for r in rs)}-{sum(r["fd"] for r in rs)}', fmt("impact", mean(acc, "impact"))]
        out.append(row + (extra(rs) if extra else []))
    headers = [label] + (["Matchs", "V-D"] if with_matches else []) + ["Rounds", "ACS", "K/D", "ADR", "KAST", "FB-FD", "Impact"]
    return headers, out


def clutch_table(rows):
    cells = []
    for n in range(1, 6):
        tries = [r for r in rows if r["clutch_vs"] == n]
        won = sum(r["clutch_won"] for r in tries)
        cells.append(f"{won}/{len(tries)}" if tries else "-")
    # 1v4 and 1v5 are shown but left out of the total: they are almost never winnable.
    total = [r for r in rows if 1 <= r["clutch_vs"] <= 3]
    return table(["", "1v1", "1v2", "1v3", "1v4", "1v5", "Total 1v1 à 1v3"],
                 [["Clutchs gagnés"] + cells + [f'{sum(r["clutch_won"] for r in total)}/{len(total)}']])


def utility_table(matches_rows, top_matches_rows):
    """Ability casts per round by agent, against top ranked players on the same agent (C, Q, E, X)."""
    keys = [("cast_grenade", "C"), ("cast_ability1", "Q"), ("cast_ability2", "E"), ("cast_ultimate", "X")]
    out = []
    by_agent = defaultdict(list)
    for m in matches_rows:
        by_agent[m["agent"]].append(m)
    for agent, ms in sorted(by_agent.items(), key=lambda kv: -len(kv[1])):
        rounds = sum(m["rounds"] for m in ms)
        top = [m for m in top_matches_rows if m["agent"] == agent]
        top_rounds = sum(m["rounds"] for m in top)
        row = [esc(agent), len(ms)]
        for k, _ in keys:
            mine = sum(m[k] for m in ms) / rounds if rounds else 0
            ref = sum(m[k] for m in top) / top_rounds if top_rounds else None
            # Flag abilities used far less than top ranked players on the same agent.
            low = ref is not None and ref >= 0.1 and mine < 0.7 * ref and rounds >= 100
            value = f'<span class="under">{mine:.2f}</span>' if low else f"{mine:.2f}"
            row.append(value + (f' <span class="muted">({ref:.2f})</span>' if ref is not None else ""))
        out.append(row)
    return table(["Agent", "Matchs"] + [f"{label} par round" for _, label in keys], out)


def weapon_benchmark(top_rows):
    """Kills per round by weapon held, over top ranked players."""
    acc = defaultdict(lambda: [0, 0])
    for r in top_rows:
        if r["weapon"]:
            acc[r["weapon"]][0] += r["kills"]
            acc[r["weapon"]][1] += 1
    return {w: k / n for w, (k, n) in acc.items() if n}


def form_section(rows, top_ref):
    per_match = defaultdict(list)
    for r in rows:
        per_match[r["match"]].append(r)
    points = []
    for _, rs in sorted(per_match.items(), key=lambda kv: kv[1][0]["date"]):
        acs = sum(r["score"] for r in rs) / len(rs)
        kills, deaths = sum(r["kills"] for r in rs), sum(r["deaths"] for r in rs)
        points.append((f"{rs[0]['date']:%d/%m}", acs, f"{rs[0]['date']:%d/%m} · {rs[0]['map']} · {rs[0]['agent']} · ACS {acs:.0f} · {kills}/{deaths}"))
    y_max = max(300, math.ceil(max(p[1] for p in points) / 100) * 100)
    ref = top_ref.get("acs")
    return ('<p class="small">ACS à chaque match (points) et moyenne glissante sur 5 matchs (ligne). '
            f"Ligne de référence : top ranked sur ses agents ({ref:.0f}).</p>" if ref else "") + form_chart(
        points, y_max=y_max, ref=ref, unit="", label="ACS par match")


def round_impact(rows):
    """Team round win rate depending on what the player did in the round."""
    base = sum(r["won"] for r in rows) / len(rows)
    cases = [("Fait le first blood", lambda r: r["fb"]), ("Subit la first death", lambda r: r["fd"]),
             ("Fait 2 kills ou plus", lambda r: r["kills"] >= 2), ("Ne fait aucun kill", lambda r: r["kills"] == 0),
             ("Meurt à 0 dégât", lambda r: r["zero_damage_death"]), ("Survit au round", lambda r: r["survived"]),
             ("Prend une revenge", lambda r: r["revenge_given"] > 0)]
    out = []
    for label, cond in cases:
        rs = [r for r in rows if cond(r)]
        k = sum(r["won"] for r in rs)
        out.append([label, len(rs), heat(k, len(rs), center=base, span=0.3, tip=f"{k}/{len(rs)} rounds gagnés")])
    return (f'<p class="small">Rounds gagnés par l\'équipe selon ce que le joueur a fait dans le round. Couleur : par rapport à la moyenne '
            f"de ses rounds ({round(100 * base)} %).</p>" + table(["Dans le round, le joueur…", "Rounds", "Rounds gagnés"], out))


def weapons_section(rows, top_weapons):
    groups = defaultdict(list)
    for r in rows:
        if r["weapon"]:
            groups[r["weapon"]].append(r)
    out = []
    for weapon, rs in sorted(groups.items(), key=lambda kv: -len(kv[1]))[:8]:
        kpr = sum(r["kills"] for r in rs) / len(rs)
        ref = top_weapons.get(weapon)
        out.append([esc(weapon), len(rs), f"{kpr:.2f}", f"{ref:.2f}" if ref else "-", f'{sum(r["damage"] for r in rs) / len(rs):.0f}',
                    pct(sum(r["won"] for r in rs), len(rs))])
    return ('<p class="small">Arme principale achetée ou ramassée au début du round.</p>'
            + table(["Arme", "Rounds", "Kills par round", "Top ranked", "ADR", "Rounds gagnés"], out))


def death_spots(rows):
    """Callouts where the player dies most, per map and side."""
    groups = defaultdict(list)
    for r in rows:
        if r["death_spot"]:
            groups[(r["map"], r["side"])].append(r)
    out = []
    for (map_name, side), rs in sorted(groups.items(), key=lambda kv: -len(kv[1])):
        for spot, n in Counter(r["death_spot"] for r in rs).most_common(2):
            if n >= 4:
                early = sum(1 for r in rs if r["death_spot"] == spot and r["death_ms"] is not None and r["death_ms"] < 25000)
                out.append([esc(map_name), "Attaque" if side == "att" else "Défense", esc(spot), n, pct(n, len(rs)), pct(early, n)])
    return ('<p class="small">Endroits où le joueur meurt le plus, par carte et par side (au moins 4 morts). « Part » : part de ses morts '
            "sur cette carte et ce side. « Avant 25 s » : morts dans les 25 premières secondes du round.</p>"
            + table(["Carte", "Side", "Endroit", "Morts", "Part", "Avant 25 s"], out[:14], numeric_from=3))


def player_tab(name, rows, opp_rows, top_by_agent, before_rows, before_label, matches_rows, top_matches_rows, top_weapons):
    acc = values(rows)
    opp_acc = values(opp_rows)
    top_ref = mixed_benchmark(rows, top_by_agent)
    n_matches = len({r["match"] for r in rows})
    wins = len({r["match"] for r in rows if r["match_won"]})
    agents = Counter(r["agent"] for r in rows)
    agent_line = ", ".join(f"{a} ({round(100 * n / len(rows))} %)" for a, n in agents.most_common(4))
    kills, deaths = sum(r["kills"] for r in rows), sum(r["deaths"] for r in rows)
    before_acc = values(before_rows) if len(before_rows) >= MIN_ROUNDS else None

    def delta(key):
        if not before_acc or mean(before_acc, key) is None:
            return None, ""
        d = mean(acc, key) - mean(before_acc, key)
        kind, better = next((kd, b) for k, _, kd, b, _, _ in STATS if k == key)
        txt = f"{100 * d:+.0f} pts" if kind == "rate" else f"{d:+.1f}" if key == "impact" else f"{d:+.0f}"
        return f"{txt} {before_label}", ("good" if (d > 0) == better else "bad") if abs(d) > 1e-9 else ""

    head = [f"<h2>{esc(name)}</h2>",
            f'<p class="muted">{n_matches} matchs ({wins}V-{n_matches - wins}D), {len(rows)} rounds · Agents : {esc(agent_line)}</p>',
            tiles([tile("ACS", fmt("acs", mean(acc, "acs")), *delta("acs")),
                   tile("K/D", f"{kills / deaths:.2f}" if deaths else "-"),
                   tile("ADR", fmt("adr", mean(acc, "adr")), *delta("adr")),
                   tile("KAST", fmt("kast", mean(acc, "kast")), *delta("kast")),
                   tile("Headshots", fmt("hs", mean(acc, "hs")), *delta("hs")),
                   tile("First bloods - deaths", f'{sum(r["fb"] for r in rows)}-{sum(r["fd"] for r in rows)}'),
                   tile("Impact", fmt("impact", mean(acc, "impact")), *delta("impact"))])]

    stat_table_rows, gaps = stat_rows(acc, opp_acc, top_ref)
    gaps.sort(key=lambda g: (g["p"], -g["gap"]))
    who_fr = {"opp": "adversaires de même niveau", "top": "top ranked sur ses agents"}
    seen = set()
    strengths, weaknesses = [], []
    for g in gaps:
        if (g["key"], g["good"]) in seen:
            continue
        seen.add((g["key"], g["good"]))
        card = point([who_fr[g["who"]]], f'{g["label"]} : {fmt(g["key"], g["value"])}', [f'référence {fmt(g["key"], g["ref"])}'],
                     "good" if g["good"] else "bad")
        (strengths if g["good"] else weaknesses).append(card)

    body = head + ['<div class="cols">',
                   f'<div class="col"><h3>Points forts</h3>{points(strengths[:5], "Rien de net.")}</div>',
                   f'<div class="col"><h3>À travailler</h3>{points(weaknesses[:5], "Rien de net.")}</div></div>',
                   "<h3>Statistiques complètes</h3>",
                   '<p class="small">Valeur colorée : écart net avec les adversaires de même niveau. ▲▼ : écart net avec le top ranked '
                   "sur les mêmes agents (pondéré par ses rounds sur chaque agent). Survoler un libellé pour sa définition.</p>",
                   table(["Statistique", name, "Adversaires (même niveau)", "Top ranked (mêmes agents)"], stat_table_rows)]
    body += ["<h3>Forme</h3>", form_section(rows, top_ref), "<h3>Impact sur le round</h3>", round_impact(rows)]
    side_headers, side_rows = split_table(rows, lambda r: "Attaque" if r["side"] == "att" else "Défense", "Side", with_matches=False)
    body += ["<h3>Par side</h3>", table(side_headers, side_rows)]
    agent_headers, agent_rows = split_table(rows, lambda r: r["agent"], "Agent")
    body += ["<h3>Par agent</h3>", table(agent_headers, agent_rows)]
    map_headers, map_rows = split_table(rows, lambda r: r["map"], "Carte")
    body += ["<h3>Par carte</h3>", table(map_headers, map_rows)]
    body += ["<h3>Armes</h3>", weapons_section(rows, top_weapons), "<h3>Où il meurt le plus</h3>", death_spots(rows),
             "<h3>Clutchs</h3>", clutch_table(rows),
             "<h3>Utilitaire</h3>", '<p class="small">Utilisations par round ; entre parenthèses, le top ranked sur le même agent. '
             "En rouge : moins de 70 % de l'usage du top ranked (au moins 100 rounds sur l'agent).</p>",
             utility_table(matches_rows, top_matches_rows)]
    maps = Counter(r["map"] for r in rows)
    cards = []
    for map_name, _ in maps.most_common():
        mr = [r for r in rows if r["map"] == map_name]
        if len({r["match"] for r in mr}) < MIN_MAP_MATCHES:
            continue
        won = [r["fb_loc"] for r in mr if r["fb_loc"]]
        lost = [r["fd_loc"] for r in mr if r["fd_loc"]]
        cards.append(f'<div class="mapcard">{duel_map(map_name, won, lost)}<div class="cap"><strong>{esc(map_name)}</strong> · '
                     f"{len(won)} first bloods, {len(lost)} first deaths</div></div>")
    if cards:
        body += ["<h3>Duels d'ouverture sur la carte</h3>", f"<p>{DUEL_KEY}</p>", f'<div class="maps">{"".join(cards)}</div>']
    return "".join(body)


def roster_table(rows, top_by_agent, tab_ids):
    """One line per player: the headline numbers of the period."""
    out = []
    by_player = defaultdict(list)
    for r in rows:
        by_player[r["name"]].append(r)
    for name, rs in sorted(by_player.items(), key=lambda kv: -len(kv[1])):
        acc = values(rs)
        kills, deaths = sum(r["kills"] for r in rs), sum(r["deaths"] for r in rs)
        link = f'<td><a href="#{tab_ids[name]}" onclick="openTab(\'{tab_ids[name]}\');return false">{esc(name)}</a></td>' \
            if name in tab_ids else f"<td>{esc(name)}</td>"
        out.append([link, len({r["match"] for r in rs}), fmt("acs", mean(acc, "acs")), f"{kills / deaths:.2f}" if deaths else "-",
                    fmt("adr", mean(acc, "adr")), fmt("kast", mean(acc, "kast")), fmt("hs", mean(acc, "hs")),
                    f'{sum(r["fb"] for r in rs)}-{sum(r["fd"] for r in rs)}', fmt("opening", mean(acc, "opening")),
                    fmt("traded", mean(acc, "traded")), fmt("impact", mean(acc, "impact"))])
    return table(["Joueur", "Matchs", "ACS", "K/D", "ADR", "KAST", "HS", "FB-FD", "Duels d'ouv.", "Morts avec revenge", "Impact"], out)
