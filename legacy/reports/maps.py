"""Map sheets: everything about one map in one place, against top ranked games on the same map."""
from collections import Counter

from .charts import DUEL_KEY, duel_map, heat, pct, table, tile, tiles
from .facts import callout
from .page import esc, point, points, round_ref
from .players import fmt, mean, values

SIDE_FR = {"att": "Attaque", "def": "Défense"}
MIN_TOP_N = 20


def rate(rows, pred):
    rows = list(rows)
    return sum(1 for r in rows if pred(r)), len(rows)


def center(k, n, fallback=0.5):
    return k / n if n >= MIN_TOP_N else fallback


def map_tab(map_name, now_r, now_d, now_pr, now_pm, top_r, top_pm, findings):
    sq = [r for r in now_r if r["team"] == "squad" and r["map"] == map_name]
    tp = [r for r in top_r if r["map"] == map_name]
    has_top = len({r["match"] for r in tp}) >= 10
    matches = {}
    for r in sq:
        m = matches.setdefault(r["match"], [0, 0])
        m[0 if r["won"] else 1] += 1
    wins = sum(w > l for w, l in matches.values())

    def kpi(label, pred, subset=lambda r: True):
        k, n = rate((r for r in sq if subset(r)), pred)
        tk, tn = rate((r for r in tp if subset(r)), pred)
        return tile(label, pct(k, n), f"top ranked {pct(tk, tn)}" if has_top and tn else None)

    body = [f"<h2>{esc(map_name)}</h2>",
            f'<p class="muted">{len(matches)} matchs ({wins}V-{len(matches) - wins}D), {len(sq)} rounds'
            + (f" · référence : {len({r['match'] for r in tp})} matchs du top ranked sur cette carte" if has_top else
               " · carte absente du pool actuel du top ranked : pas de référence") + "</p>",
            tiles([kpi("Rounds gagnés", lambda r: r["won"]),
                   kpi("En attaque", lambda r: r["won"], lambda r: r["side"] == "att"),
                   kpi("En défense", lambda r: r["won"], lambda r: r["side"] == "def"),
                   kpi("Pistols", lambda r: r["won"], lambda r: r["buy"] == "pistol"),
                   kpi("First blood", lambda r: r["first_kill"], lambda r: r["first_kill"] is not None),
                   kpi("Post-plant gagné", lambda r: r["won"], lambda r: r["side"] == "att" and r["planted"]),
                   kpi("Retake réussi", lambda r: r["won"], lambda r: r["side"] == "def" and r["planted"])])]
    if findings:
        body += ["<h3>Points forts et faibles sur cette carte</h3>", points(findings, "")]

    for side in ("att", "def"):
        rs = [r for r in sq if r["side"] == side]
        ts = [r for r in tp if r["side"] == side]
        body.append(f"<h3>{SIDE_FR[side]}</h3>")
        site_rows = []
        planted = [r for r in rs if r["planted"]]
        t_planted = [r for r in ts if r["planted"]]
        for site in sorted({r["plant_site"] for r in planted + t_planted}):
            mine = [r for r in planted if r["plant_site"] == site]
            theirs = [r for r in t_planted if r["plant_site"] == site]
            k, n = rate(mine, lambda r: r["won"])
            tk, tn = rate(theirs, lambda r: r["won"])
            label = "Vos plants" if side == "att" else "Plants subis"
            site_rows.append([site, pct(len(mine), len(planted)), pct(len(theirs), len(t_planted)) if has_top else "-",
                              heat(k, n, center=center(tk, tn), tip=f"{k}/{n} · top ranked {pct(tk, tn)}"), pct(tk, tn) if has_top else "-"])
        result = "Post-plant gagné" if side == "att" else "Retake réussi"
        no_plant = rate((r for r in rs if r["buy"] != "eco"), lambda r: not r["planted"])
        t_no_plant = rate((r for r in ts if r["buy"] != "eco"), lambda r: not r["planted"])
        conv = rate((r for r in rs if r["first_kill"] is True), lambda r: r["won"])
        rec = rate((r for r in rs if r["first_kill"] is False), lambda r: r["won"])
        tconv = rate((r for r in ts if r["first_kill"] is True), lambda r: r["won"])
        trec = rate((r for r in ts if r["first_kill"] is False), lambda r: r["won"])
        body += ['<div class="cols"><div class="col">',
                 table(["Site", "Vos plants" if side == "att" else "Plants subis", "Top ranked", result, "Top ranked"], site_rows),
                 '</div><div class="col">',
                 table(["", "Vous", "Top ranked"], [
                     ["Round gagné après le first blood", heat(*conv, center=center(*tconv, 0.69), tip=f"{conv[0]}/{conv[1]}"), pct(*tconv) if has_top else "-"],
                     ["Round gagné après la first death", heat(*rec, center=center(*trec, 0.3), tip=f"{rec[0]}/{rec[1]}"), pct(*trec) if has_top else "-"],
                     ["Rounds sans plant (hors eco)" if side == "att" else "Rounds sans plant adverse (hors eco)",
                      f"{pct(*no_plant)} <span class=\"muted\">({no_plant[1]})</span>", pct(*t_no_plant) if has_top else "-"],
                 ]), "</div></div>"]
        fd = Counter(d["callout"] for d in now_d if d["map"] == map_name and d["side"] == side and d["team"] == "squad" and d["opening"])
        fb_spots = Counter()
        for p in now_pr:
            if p["map"] == map_name and p["side"] == side and p["team"] == "squad" and p["fb"] and p["fb_loc"]:
                fb_spots[callout(map_name, p["fb_loc"])] += 1
        spot_rows = [[esc(s), n, fb_spots.get(s, 0)] for s, n in fd.most_common(5)]
        mr = [p for p in now_pr if p["map"] == map_name and p["side"] == side and p["team"] == "squad"]
        won = [p["fb_loc"] for p in mr if p["fb_loc"]]
        lost = [p["fd_loc"] for p in mr if p["fd_loc"]]
        body += ['<div class="cols"><div class="col"><h3>Duels d\'ouverture ' + ("en attaque" if side == "att" else "en défense") + "</h3>",
                 f"<p>{DUEL_KEY}</p>", f'<div class="mapcard" style="max-width:420px">{duel_map(map_name, won, lost, size=360)}</div>',
                 '</div><div class="col"><h3>Où vous mourez en premier</h3>',
                 table(["Endroit", "First deaths", "First bloods au même endroit"], spot_rows), "</div></div>"]

    body.append("<h3>Compositions</h3>")
    body.append(compositions(map_name, now_pm, top_pm, has_top))
    body.append("<h3>Joueurs sur cette carte</h3>")
    body.append(players(map_name, now_pr))
    throws = [r for r in sq if r["max_adv"] >= 2 and not r["won"]]
    if throws:
        refs = ", ".join(round_ref(r) for r in sorted(throws, key=lambda r: r["date"], reverse=True)[:10])
        body += ["<h3>Rounds à revoir</h3>", points([point(["throws"], f"{len(throws)} rounds perdus avec 2 joueurs d'avance ou plus",
                                                              [f"À revoir : {refs}"], "bad")], "")]
    return "".join(body)


def compositions(map_name, now_pm, top_pm, has_top):
    def comps(rows, team):
        by = {}
        for p in rows:
            if p["team"] == team and p["map"] == map_name:
                by.setdefault((p["match"], p["team_id"]), []).append(p)
        return [(tuple(sorted(p["agent"] for p in ps)), ps[0]["won"]) for ps in by.values() if len(ps) == 5]

    mine, top = comps(now_pm, "squad"), comps(top_pm, "top")
    rows = []
    for comp, n in Counter(c for c, _ in mine).most_common(5):
        w = sum(won for c, won in mine if c == comp)
        rows.append([esc(", ".join(comp)), n, f"{w}-{n - w}"])
    top_rows = []
    for comp, n in Counter(c for c, _ in top).most_common(5):
        w = sum(won for c, won in top if c == comp)
        top_rows.append([esc(", ".join(comp)), pct(n, len(top)), pct(w, n)])
    # Agent presence is steadier than full compositions, which rarely repeat in solo queue.
    agents = Counter(a for c, _ in top for a in c)
    agent_rows = [[esc(a), pct(n, len(top)), pct(sum(won for c, won in top if a in c), n)] for a, n in agents.most_common(10)]
    out = ['<div class="cols"><div class="col"><h3>Les vôtres</h3>', table(["Composition", "Matchs", "V-D"], rows), "</div>"]
    if has_top:
        out += ['<div class="col"><h3>Top ranked</h3>', table(["Composition", "Équipes", "Victoires"], top_rows),
                "<h3>Agents les plus joués en top ranked</h3>", table(["Agent", "Présence", "Victoires"], agent_rows), "</div>"]
    return "".join(out) + "</div>"


def players(map_name, now_pr):
    rows = []
    sq = [p for p in now_pr if p["team"] == "squad" and p["map"] == map_name]
    for name, _ in Counter(p["name"] for p in sq).most_common():
        rs = [p for p in sq if p["name"] == name]
        acc = values(rs)
        kills, deaths = sum(r["kills"] for r in rs), sum(r["deaths"] for r in rs)
        agent = Counter(r["agent"] for r in rs).most_common(1)[0][0]
        rows.append([esc(name), esc(agent), len({r["match"] for r in rs}), fmt("acs", mean(acc, "acs")), f"{kills / deaths:.2f}" if deaths else "-",
                     fmt("adr", mean(acc, "adr")), fmt("kast", mean(acc, "kast")), f'{sum(r["fb"] for r in rs)}-{sum(r["fd"] for r in rs)}',
                     fmt("impact", mean(acc, "impact"))])
    return table(["Joueur", "Agent principal", "Matchs", "ACS", "K/D", "ADR", "KAST", "FB-FD", "Impact"], rows, numeric_from=2)
