"""Team tab sections of the period report; the top ranked rounds serve as reference where opponents would mirror us."""
from collections import Counter
from statistics import median

from .charts import DUEL_KEY, duel_map, form_chart, heat, pct, rate_bar, table, tile, tiles
from .page import BUY_FR, esc

STATES = ["5v4", "4v5", "4v4", "4v3", "3v4", "3v3", "3v2", "2v3", "2v2", "2v1", "1v2", "1v1"]
SIDE_FR = {"att": "Attaque", "def": "Défense"}
MIN_MAP_MATCHES = 3


def rate(rows, pred):
    rows = list(rows)
    return sum(1 for r in rows if pred(r)), len(rows)


def ref_txt(k, n):
    return f"{pct(k, n)}" if n else "-"


def matches_of(rounds):
    """Per match: map, date, rounds won and lost by the squad."""
    out = {}
    for r in rounds:
        if r["team"] != "squad":
            continue
        m = out.setdefault(r["match"], {"map": r["map"], "date": r["date"], "won": 0, "lost": 0})
        m["won" if r["won"] else "lost"] += 1
    return out


def kpis(now_r, now_pr, before_r, before_pr, before_label="vs avant"):
    sq = [r for r in now_r if r["team"] == "squad"]
    bq = [r for r in before_r if r["team"] == "squad"]
    ms = matches_of(now_r)
    wins = sum(m["won"] > m["lost"] for m in ms.values())

    def delta(rows, before, pred, subset=lambda r: True):
        k, n = rate((r for r in rows if subset(r)), pred)
        bk, bn = rate((r for r in before if subset(r)), pred)
        if not n:
            return "-", None, ""
        if not bn:
            return pct(k, n), None, ""
        d = round(100 * (k / n - bk / bn))
        return pct(k, n), (f"{d:+d} pts {before_label}" if d else f"= {before_label}"), "good" if d > 0 else "bad" if d < 0 else ""

    sq_p = [r for r in now_pr if r["team"] == "squad"]
    bq_p = [r for r in before_pr if r["team"] == "squad"]
    pistol = rate((r for r in sq if r["buy"] == "pistol"), lambda r: r["won"])
    deaths = [r for r in sq_p if r["deaths"]]
    return tiles([
        tile("Matchs", f"{wins}V - {len(ms) - wins}D"),
        tile("Rounds gagnés", *delta(sq, bq, lambda r: r["won"])),
        tile("En attaque", *delta(sq, bq, lambda r: r["won"], lambda r: r["side"] == "att")),
        tile("En défense", *delta(sq, bq, lambda r: r["won"], lambda r: r["side"] == "def")),
        tile("Pistols gagnés", f"{pistol[0]}/{pistol[1]}"),
        tile("First blood", *delta(sq, bq, lambda r: r["first_kill"], lambda r: r["first_kill"] is not None)),
        tile("KAST équipe", *delta(sq_p, bq_p, lambda r: r["kast"])),
        tile("Morts avec revenge", pct(sum(r["traded"] for r in deaths), len(deaths))),
    ])


def form(now_r):
    ms = sorted(matches_of(now_r).items(), key=lambda kv: kv[1]["date"])
    points = [(f"{m['date']:%d/%m}", m["won"] / (m["won"] + m["lost"]),
               f"{m['date']:%d/%m} · {m['map']} · {m['won']}-{m['lost']}") for _, m in ms]
    return ('<p class="small">Part des rounds gagnés à chaque match (points) et moyenne glissante sur 5 matchs (ligne).</p>'
            + form_chart(points))


def map_pool(now_r):
    sq = [r for r in now_r if r["team"] == "squad"]
    ms = matches_of(now_r)
    rows = []
    for map_name in sorted({m["map"] for m in ms.values()}, key=lambda n: -sum(m["map"] == n for m in ms.values())):
        mm = [m for m in ms.values() if m["map"] == map_name]
        rs = [r for r in sq if r["map"] == map_name]
        wins = sum(m["won"] > m["lost"] for m in mm)
        att = rate((r for r in rs if r["side"] == "att"), lambda r: r["won"])
        dfn = rate((r for r in rs if r["side"] == "def"), lambda r: r["won"])
        pis = rate((r for r in rs if r["buy"] == "pistol"), lambda r: r["won"])
        fb = rate((r for r in rs if r["first_kill"] is not None), lambda r: r["first_kill"])
        pp = rate((r for r in rs if r["side"] == "att" and r["planted"]), lambda r: r["won"])
        rt = rate((r for r in rs if r["side"] == "def" and r["planted"]), lambda r: r["won"])
        rows.append([esc(map_name), len(mm), f"{wins}-{len(mm) - wins}", rate_bar(*rate(rs, lambda r: r["won"])),
                     rate_bar(*att), rate_bar(*dfn), f"{pis[0]}/{pis[1]}", pct(*fb), pct(*pp), pct(*rt)])
    return table(["Carte", "Matchs", "V-D", "Rounds gagnés", "Attaque", "Défense", "Pistols", "First blood", "Post-plant", "Retake"], rows)


def conversions(rounds, team):
    """After a pistol won / lost: win rate of the next two rounds, per half."""
    # Keyed by the in-game team: top ranked rows share one label for both teams.
    by = {(r["match"], r["team_id"], r["round"]): r for r in rounds}
    out = {(w, k): [0, 0] for w in (True, False) for k in (1, 2)}
    for r in rounds:
        if r["team"] != team or r["round"] not in (0, 12):
            continue
        for k in (1, 2):
            nxt = by.get((r["match"], r["team_id"], r["round"] + k))
            if nxt:
                out[(r["won"], k)][0] += nxt["won"]
                out[(r["won"], k)][1] += 1
    return out


def economy(now_r, top_r):
    sq = [r for r in now_r if r["team"] == "squad"]
    pistol_rows = []
    for side in ("att", "def"):
        k, n = rate((r for r in sq if r["buy"] == "pistol" and r["side"] == side), lambda r: r["won"])
        tk, tn = rate((r for r in top_r if r["buy"] == "pistol" and r["side"] == side), lambda r: r["won"])
        pistol_rows.append([SIDE_FR[side], f'{rate_bar(k, n)} <span class="muted">({k}/{n})</span>', ref_txt(tk, tn)])
    conv, top_conv = conversions(now_r, "squad"), conversions(top_r, "top")
    conv_rows = []
    for won, label in ((True, "Pistol gagné"), (False, "Pistol perdu")):
        row = [label]
        for k in (1, 2):
            c, t = conv[(won, k)], top_conv[(won, k)]
            row += [heat(*c, center=t[0] / t[1] if t[1] else 0.5, tip=f"{c[0]}/{c[1]} · top ranked {ref_txt(*t)}"), ref_txt(*t)]
        conv_rows.append(row)
    buys = ("eco", "force", "full")
    matrix = []
    for mine in buys:
        row = [BUY_FR[mine]]
        for theirs in buys:
            k, n = rate((r for r in sq if r["buy"] == mine and r["opp_buy"] == theirs), lambda r: r["won"])
            tk, tn = rate((r for r in top_r if r["buy"] == mine and r["opp_buy"] == theirs), lambda r: r["won"])
            row.append(heat(k, n, tip=f"{k}/{n} rounds gagnés · top ranked {ref_txt(tk, tn)}"))
        matrix.append(row)
    share_rows = []
    for label, rows in (("Escouade", sq), ("Adversaires", [r for r in now_r if r["team"] == "opp"]), ("Top ranked", top_r)):
        rows = [r for r in rows if r["buy"] != "pistol"]
        c = Counter(r["buy"] for r in rows)
        share_rows.append([label] + [pct(c[b], len(rows)) for b in buys])
    return "".join([
        '<div class="cols"><div class="col"><h3>Pistol rounds</h3>',
        table(["", "Gagnés", "Top ranked"], pistol_rows),
        "<h3>Rounds qui suivent le pistol</h3>",
        '<p class="small">Couleur : au-dessus (bleu) ou en dessous (rouge) du top ranked.</p>',
        table(["", "R2/R14", "Top", "R3/R15", "Top"], conv_rows),
        '</div><div class="col"><h3>Rounds gagnés selon les achats</h3>',
        '<p class="small">Lignes : votre achat. Colonnes : celui de l\'adversaire. Survoler pour le nombre de rounds et le top ranked.</p>',
        table(["Vous \\ eux"] + [BUY_FR[b] for b in buys], matrix),
        "<h3>Répartition des achats (hors pistols)</h3>",
        table(["", "eco", "force buy", "full buy"], share_rows),
        "</div></div>"])


def opening(now_r, now_pr, top_r):
    sq = [r for r in now_r if r["team"] == "squad"]
    rows = []
    for side in ("att", "def"):
        rs = [r for r in sq if r["side"] == side]
        ts = [r for r in top_r if r["side"] == side]
        fb = rate((r for r in rs if r["first_kill"] is not None), lambda r: r["first_kill"])
        conv = rate((r for r in rs if r["first_kill"] is True), lambda r: r["won"])
        rec = rate((r for r in rs if r["first_kill"] is False), lambda r: r["won"])
        tconv = rate((r for r in ts if r["first_kill"] is True), lambda r: r["won"])
        trec = rate((r for r in ts if r["first_kill"] is False), lambda r: r["won"])
        times = [r["first_ms"] / 1000 for r in rs if r["first_ms"] is not None]
        rows.append([SIDE_FR[side], rate_bar(*fb), heat(*conv, center=tconv[0] / tconv[1] if tconv[1] else 0.5, tip=f"top ranked {ref_txt(*tconv)}"),
                     ref_txt(*tconv), heat(*rec, center=trec[0] / trec[1] if trec[1] else 0.5, tip=f"top ranked {ref_txt(*trec)}"),
                     ref_txt(*trec), f"{median(times):.0f} s" if times else "-"])
    out = ['<p class="small">Couleur des conversions : au-dessus (bleu) ou en dessous (rouge) du top ranked.</p>',
           table(["", "First blood pris", "Round gagné après FB (5v4)", "Top", "Round gagné après FD (4v5)", "Top", "Premier kill (médiane)"], rows)]
    sq_p = [r for r in now_pr if r["team"] == "squad"]
    cards = []
    for map_name, n in Counter(r["map"] for r in sq).most_common():
        if len({r["match"] for r in sq if r["map"] == map_name}) < MIN_MAP_MATCHES:
            continue
        for side in ("att", "def"):
            mr = [r for r in sq_p if r["map"] == map_name and r["side"] == side]
            won = [r["fb_loc"] for r in mr if r["fb_loc"]]
            lost = [r["fd_loc"] for r in mr if r["fd_loc"]]
            cards.append(f'<div class="mapcard">{duel_map(map_name, won, lost)}<div class="cap"><strong>{esc(map_name)} · {SIDE_FR[side]}</strong> · '
                         f"{len(won)} FB, {len(lost)} FD</div></div>")
    if cards:
        out += [f"<details><summary>Où se jouent vos duels d'ouverture ({len(cards)} cartes)</summary>", f"<p>{DUEL_KEY}</p>",
                f'<div class="maps">{"".join(cards)}</div></details>']
    return "".join(out)


def situations(now_r, top_r):
    sq = [r for r in now_r if r["team"] == "squad"]
    rows = []
    for state in STATES:
        k, n = rate((r for r in sq if state in r["states"]), lambda r: r["won"])
        tk, tn = rate((r for r in top_r if state in r["states"]), lambda r: r["won"])
        center = tk / tn if tn else 0.5
        rows.append([state, heat(k, n, center=center, span=0.2, tip=f"{k}/{n} rounds · top ranked {ref_txt(tk, tn)}"), n, ref_txt(tk, tn)])
    throws = rate((r for r in sq if r["max_adv"] >= 2), lambda r: not r["won"])
    tthrows = rate((r for r in top_r if r["max_adv"] >= 2), lambda r: not r["won"])
    comebacks = rate((r for r in sq if r["min_adv"] <= -2), lambda r: r["won"])
    tcomebacks = rate((r for r in top_r if r["min_adv"] <= -2), lambda r: r["won"])
    return "".join([
        '<p class="small">Rounds gagnés quand vous êtes passés par cette situation (au moins une fois dans le round). '
        "Couleur : au-dessus ou en dessous du top ranked.</p>",
        '<div class="cols"><div class="col">', table(["Situation", "Rounds gagnés", "Rounds", "Top ranked"], rows), "</div>",
        '<div class="col">', tiles([tile("Throws en avantage 2+", pct(*throws), f"top ranked {ref_txt(*tthrows)}", "bad" if throws[1] and tthrows[1] and throws[0] / throws[1] > tthrows[0] / tthrows[1] else "good"),
                                     tile("Comebacks à 2 de moins", pct(*comebacks), f"top ranked {ref_txt(*tcomebacks)}", "good" if comebacks[1] and tcomebacks[1] and comebacks[0] / comebacks[1] > tcomebacks[0] / tcomebacks[1] else "bad")]),
        f'<p class="small">Throws : {throws[0]} rounds perdus sur {throws[1]} où vous avez eu 2 joueurs d\'avance ou plus. '
        f"Comebacks : {comebacks[0]} rounds gagnés sur {comebacks[1]} où vous avez été à 2 de moins ou pire.</p></div></div>"])


def sites(now_r, top_r):
    sq = [r for r in now_r if r["team"] == "squad"]
    rows = []
    # Reference rates: the same map and site in top ranked games, or all top ranked plants when the map is out of their pool.
    all_pp = rate((r for r in top_r if r["side"] == "att" and r["planted"]), lambda r: r["won"])
    all_rt = rate((r for r in top_r if r["side"] == "def" and r["planted"]), lambda r: r["won"])
    for map_name in [m for m, _ in Counter(r["map"] for r in sq).most_common()]:
        att = [r for r in sq if r["map"] == map_name and r["side"] == "att" and r["planted"]]
        dfn = [r for r in sq if r["map"] == map_name and r["side"] == "def" and r["planted"]]
        tatt = [r for r in top_r if r["map"] == map_name and r["side"] == "att" and r["planted"]]
        tdef = [r for r in top_r if r["map"] == map_name and r["side"] == "def" and r["planted"]]
        for site in sorted({r["plant_site"] for r in att + dfn}):
            a = [r for r in att if r["plant_site"] == site]
            d = [r for r in dfn if r["plant_site"] == site]
            ta = [r for r in tatt if r["plant_site"] == site]
            tpp = rate(ta, lambda r: r["won"]) if len(ta) >= 20 else all_pp
            trt = rate((r for r in tdef if r["plant_site"] == site), lambda r: r["won"])
            trt = trt if trt[1] >= 20 else all_rt
            pa, pd = rate(a, lambda r: r["won"]), rate(d, lambda r: r["won"])
            rows.append([esc(map_name), site, pct(len(a), len(att)), pct(len(ta), len(tatt)) if tatt else "-",
                         heat(*pa, center=tpp[0] / tpp[1], tip=f"{pa[0]}/{pa[1]} post-plants gagnés · top ranked {ref_txt(*tpp)}"),
                         pct(len(d), len(dfn)),
                         heat(*pd, center=trt[0] / trt[1], tip=f"{pd[0]}/{pd[1]} retakes réussis · top ranked {ref_txt(*trt)}")])
    tempo_rows = []
    for label, lo, hi in (("Rapide (< 40 s)", 0, 40000), ("Moyen (40-70 s)", 40000, 70000), ("Tardif (> 70 s)", 70000, 10 ** 9)):
        k, n = rate((r for r in sq if r["side"] == "att" and r["planted"] and lo <= r["plant_ms"] < hi), lambda r: r["won"])
        tk, tn = rate((r for r in top_r if r["side"] == "att" and r["planted"] and lo <= r["plant_ms"] < hi), lambda r: r["won"])
        all_plants = sum(1 for r in sq if r["side"] == "att" and r["planted"])
        top_plants = sum(1 for r in top_r if r["side"] == "att" and r["planted"])
        tempo_rows.append([label, pct(n, all_plants), pct(tn, top_plants), heat(k, n, center=tk / tn if tn else 0.5, tip=f"{k}/{n} · top {ref_txt(tk, tn)}"), ref_txt(tk, tn)])
    numbers_rows = []
    for label, test in (("2 de moins ou pire", lambda a: a <= -2), ("1 de moins", lambda a: a == -1), ("À égalité", lambda a: a == 0),
                        ("1 de plus", lambda a: a == 1), ("2 de plus ou mieux", lambda a: a >= 2)):
        row = [label]
        for side in ("att", "def"):
            k, n = rate((r for r in sq if r["side"] == side and r["adv_at_plant"] is not None and test(r["adv_at_plant"])), lambda r: r["won"])
            tk, tn = rate((r for r in top_r if r["side"] == side and r["adv_at_plant"] is not None and test(r["adv_at_plant"])), lambda r: r["won"])
            row += [heat(k, n, center=tk / tn if tn else 0.5, tip=f"{k}/{n} · top {ref_txt(tk, tn)}"), ref_txt(tk, tn)]
        numbers_rows.append(row)
    return "".join([
        '<p class="small">Attaque : où vous plantez et combien de post-plants vous gagnez. Défense : où l\'adversaire plante contre vous '
        "et combien de retakes vous réussissez. Couleur : au-dessus (bleu) ou en dessous (rouge) du top ranked sur le même site.</p>",
        table(["Carte", "Site", "Vos plants", "Top ranked", "Post-plant gagné", "Plants subis", "Retake réussi"], rows, numeric_from=2),
        '<div class="cols"><div class="col"><h3>Tempo du plant</h3>',
        table(["", "Vos plants", "Top", "Post-plant gagné", "Top"], tempo_rows),
        '</div><div class="col"><h3>Joueurs en vie au moment du plant</h3>',
        table(["Vous par rapport à eux", "Post-plant gagné", "Top", "Retake réussi", "Top"], numbers_rows),
        "</div></div>"])


def clutches(now_pr, top_pr):
    rows = []
    for label, rs in (("Escouade", [r for r in now_pr if r["team"] == "squad"]), ("Adversaires", [r for r in now_pr if r["team"] == "opp"]),
                      ("Top ranked", top_pr)):
        cells = []
        for n in range(1, 4):
            k, t = rate((r for r in rs if r["clutch_vs"] == n), lambda r: r["clutch_won"])
            cells.append(f"{pct(k, t)} <span class=\"muted\">({k}/{t})</span>" if label != "Top ranked" else pct(k, t))
        k, t = rate((r for r in rs if r["clutch_vs"] >= 4), lambda r: r["clutch_won"])
        cells.append(f"{pct(k, t)} <span class=\"muted\">({k}/{t})</span>" if label != "Top ranked" else pct(k, t))
        rows.append([label] + cells)
    return table(["", "1v1", "1v2", "1v3", "1v4 et plus"], rows)
