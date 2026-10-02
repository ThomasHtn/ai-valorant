"""Cross-cutting analyses: what wins rounds, what drives match results, session context, lineups, compositions, revenge links."""
import math
from collections import Counter, defaultdict
from datetime import timedelta
from statistics import median

from .charts import heat, pct, table
from .page import esc

SESSION_GAP = timedelta(hours=3)


def rate(rows, pred):
    rows = list(rows)
    return sum(1 for r in rows if pred(r)), len(rows)


def ref_txt(k, n):
    return pct(k, n) if n else "-"


def pearson(xs, ys):
    n = len(xs)
    if n < 8:
        return None
    mx, my = sum(xs) / n, sum(ys) / n
    sx = math.sqrt(sum((x - mx) ** 2 for x in xs))
    sy = math.sqrt(sum((y - my) ** 2 for y in ys))
    if not sx or not sy:
        return None
    return sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / (sx * sy)


def r_cell(r):
    """Correlation shown as a signed bar: blue when the stat goes with winning, red when against."""
    if r is None:
        return "<td class=\"num\">-</td>"
    w = round(abs(r) * 100)
    color = "var(--pos)" if r > 0 else "var(--neg)"
    strength = "forte" if abs(r) >= 0.5 else "modérée" if abs(r) >= 0.3 else "faible"
    return (f'<td class="num" data-tip="Corrélation {strength} (r = {r:+.2f})" tabindex="0">{r:+.2f}'
            f'<span class="bar" aria-hidden="true"><i style="width:{w}%;background:{color}"></i></span></td>')


def with_context(rounds):
    """Adds score state at round start and previous results, per match and team."""
    by_team = defaultdict(list)
    for r in rounds:
        by_team[(r["match"], r["team_id"])].append(r)
    out = []
    for rs in by_team.values():
        rs.sort(key=lambda r: r["round"])
        us = them = 0
        streak = 0
        for i, r in enumerate(rs):
            out.append({**r, "lead": us - them, "prev": None if i == 0 else rs[i - 1]["won"], "loss_streak": streak})
            us, them = us + r["won"], them + (not r["won"])
            streak = 0 if r["won"] else streak + 1
    return out


def round_drivers(now_r, now_d, top_r, top_d):
    """Round win rate under conditions the team controls or lives through, against top ranked."""
    sq = with_context([r for r in now_r if r["team"] == "squad"])
    top = with_context(top_r)
    fd = {(d["match"], d["team_id"], d["round"]): d for d in now_d + top_d if d["opening"]}

    def first_death(r):
        return fd.get((r["match"], r["team_id"], r["round"]))

    groups = [
        ("Après la first death", [
            ("First death avec revenge", lambda r: r["first_kill"] is False and first_death(r) and first_death(r)["traded"]),
            ("First death sans revenge", lambda r: r["first_kill"] is False and first_death(r) and not first_death(r)["traded"]),
        ]),
        ("Écart d'équipement (hors pistols)", [
            ("Vous avez 1 000 de moins ou pire", lambda r: r["buy"] != "pistol" and r["loadout"] - r["opp_loadout"] <= -1000),
            ("Entre -1 000 et -300", lambda r: r["buy"] != "pistol" and -1000 < r["loadout"] - r["opp_loadout"] <= -300),
            ("À peu près égal (± 300)", lambda r: r["buy"] != "pistol" and abs(r["loadout"] - r["opp_loadout"]) < 300),
            ("Entre +300 et +1 000", lambda r: r["buy"] != "pistol" and 300 <= r["loadout"] - r["opp_loadout"] < 1000),
            ("Vous avez 1 000 de plus ou mieux", lambda r: r["buy"] != "pistol" and r["loadout"] - r["opp_loadout"] >= 1000),
        ]),
        ("Momentum (hors pistols)", [
            ("Après un round gagné", lambda r: r["buy"] != "pistol" and r["prev"] is True),
            ("Après un round perdu", lambda r: r["buy"] != "pistol" and r["prev"] is False and r["loss_streak"] == 1),
            ("Après 2 rounds perdus ou plus", lambda r: r["buy"] != "pistol" and r["loss_streak"] >= 2),
        ]),
        ("Score au début du round", [
            ("Mené de 3 ou plus", lambda r: r["lead"] <= -3),
            ("Mené de 1 ou 2", lambda r: -3 < r["lead"] < 0),
            ("À égalité", lambda r: r["lead"] == 0),
            ("Devant de 1 ou 2", lambda r: 0 < r["lead"] < 3),
            ("Devant de 3 ou plus", lambda r: r["lead"] >= 3),
        ]),
        ("Moment du match", [
            ("Première mi-temps", lambda r: r["round"] < 12),
            ("Seconde mi-temps", lambda r: 12 <= r["round"] < 24),
            ("Prolongations", lambda r: r["round"] >= 24),
        ]),
    ]
    html = []
    for title, conds in groups:
        rows = []
        for label, cond in conds:
            k, n = rate((r for r in sq if cond(r)), lambda r: r["won"])
            tk, tn = rate((r for r in top if cond(r)), lambda r: r["won"])
            rows.append([label, heat(k, n, center=tk / tn if tn else 0.5, span=0.2, tip=f"{k}/{n} · top ranked {ref_txt(tk, tn)}"), n, ref_txt(tk, tn)])
        html.append(f'<div class="col wide"><h3>{esc(title)}</h3>{table(["", "Rounds gagnés", "Rounds", "Top ranked"], rows)}</div>')
    return ('<p class="small">Rounds gagnés selon la situation. Couleur : au-dessus (bleu) ou en dessous (rouge) du top ranked dans la même situation.</p>'
            f'<div class="cols">{"".join(html)}</div>')


def match_stats(now_r, now_d, now_pr, now_pm):
    """Squad play stats per match that are not pieces of the result itself, for correlations with the match result."""
    out = {}
    for mid in {r["match"] for r in now_r if r["team"] == "squad"}:
        rs = [r for r in now_r if r["match"] == mid and r["team"] == "squad"]
        ds = [d for d in now_d if d["match"] == mid and d["team"] == "squad"]
        ps = [p for p in now_pr if p["match"] == mid and p["team"] == "squad"]
        pm = [p for p in now_pm if p["match"] == mid and p["team"] == "squad"]
        shots = sum(p["hs"] + p["bs"] + p["ls"] for p in ps)
        casts = sum(p["cast_grenade"] + p["cast_ability1"] + p["cast_ability2"] for p in pm)

        def ratio(k, n):
            return k / n if n else None

        stats = {
            "First blood pris": ratio(*rate((r for r in rs if r["first_kill"] is not None), lambda r: r["first_kill"])),
            "Morts avec revenge": ratio(*rate(ds, lambda d: d["traded"])),
            "Morts à 0 dégât": ratio(*rate(ds, lambda d: d["damage"] == 0)),
            "ADR équipe": sum(p["damage"] for p in ps) / len(ps) if ps else None,
            "Headshots": ratio(sum(p["hs"] for p in ps), shots),
            "Utilitaire par joueur et par round (C, Q, E)": casts / (len(rs) * 5) if rs and pm else None,
            "Rounds d'attaque avec plant (hors eco)": ratio(*rate((r for r in rs if r["side"] == "att" and r["buy"] != "eco"), lambda r: r["planted"])),
            "Pistols gagnés": ratio(*rate((r for r in rs if r["buy"] == "pistol"), lambda r: r["won"])),
            "Morts avant 25 s": ratio(*rate(ds, lambda d: d["ms"] < 25000)),
        }
        out[mid] = {"win_rate": sum(r["won"] for r in rs) / len(rs), "stats": stats,
                    "acs": {name: sum(p["score"] for p in ps if p["name"] == name) / max(1, sum(p["name"] == name for p in ps))
                            for name in {p["name"] for p in ps}}}
    return out


def correlations(now_r, now_d, now_pr, now_pm):
    per_match = match_stats(now_r, now_d, now_pr, now_pm)
    names = next(iter(per_match.values()))["stats"].keys() if per_match else []
    rows = []
    for name in names:
        pairs = [(m["stats"][name], m["win_rate"]) for m in per_match.values() if m["stats"][name] is not None]
        r = pearson([p[0] for p in pairs], [p[1] for p in pairs])
        rows.append((r, name, len(pairs)))
    rows.sort(key=lambda t: -abs(t[0]) if t[0] is not None else 0)
    team_rows = [[esc(name), r_cell(r), n] for r, name, n in rows]
    players = defaultdict(list)
    for m in per_match.values():
        for name, acs in m["acs"].items():
            players[name].append((acs, m["win_rate"]))
    player_rows = []
    for name, pairs in sorted(players.items(), key=lambda kv: -len(kv[1])):
        r = pearson([p[0] for p in pairs], [p[1] for p in pairs])
        med = median(p[0] for p in pairs)
        hi = [w for a, w in pairs if a >= med]
        lo = [w for a, w in pairs if a < med]
        player_rows.append([esc(name), len(pairs), r_cell(r), pct(sum(hi), len(hi)) if hi else "-", pct(sum(lo), len(lo)) if lo else "-"])
    return "".join([
        '<p class="small">Corrélation entre une stat de l\'équipe sur un match et la part des rounds gagnés dans ce match, sur tous les matchs '
        "de la période (r de -1 à +1). Plus |r| est grand, plus la stat va de pair avec le résultat. Une corrélation n'est pas une cause : "
        "elle montre ce qui accompagne vos victoires. Les stats qui sont des morceaux du résultat (post-plants, retakes, clutchs) sont "
        "exclues, car elles seraient liées à la victoire par construction.</p>",
        '<div class="cols"><div class="col"><h3>Stats d\'équipe et résultat</h3>',
        table(["Stat sur le match", "Corrélation (r)", "Matchs"], team_rows),
        '</div><div class="col"><h3>ACS de chaque joueur et résultat</h3>',
        '<p class="small">r élevé : l\'équipe gagne surtout quand ce joueur performe. Dernières colonnes : rounds gagnés quand son ACS est '
        "au-dessus ou en dessous de sa médiane.</p>",
        table(["Joueur", "Matchs", "Corrélation (r)", "ACS haut", "ACS bas"], player_rows),
        "</div></div>"])


def sessions_context(now_r, now_pr):
    """Results by rank of the match in the evening, start hour and lineup."""
    matches = {}
    for r in now_r:
        if r["team"] != "squad":
            continue
        m = matches.setdefault(r["match"], {"date": r["date"], "won": 0, "lost": 0})
        m["won" if r["won"] else "lost"] += 1
    ordered = sorted(matches.items(), key=lambda kv: kv[1]["date"])
    rank, prev = 0, None
    for _, m in ordered:
        rank = rank + 1 if prev is not None and m["date"] - prev <= SESSION_GAP else 1
        m["rank"], prev = rank, m["date"]
    lineups = defaultdict(set)
    for p in now_pr:
        if p["team"] == "squad":
            lineups[p["match"]].add(p["name"])

    def line(ms):
        wins = sum(m["won"] > m["lost"] for m in ms)
        rounds = sum(m["won"] + m["lost"] for m in ms)
        won = sum(m["won"] for m in ms)
        return [len(ms), f"{wins}-{len(ms) - wins}", heat(won, rounds, tip=f"{won}/{rounds} rounds")]

    rank_rows = []
    for label, test in (("1er match", lambda m: m["rank"] == 1), ("2e match", lambda m: m["rank"] == 2),
                        ("3e match", lambda m: m["rank"] == 3), ("4e match et plus", lambda m: m["rank"] >= 4)):
        ms = [m for m in matches.values() if test(m)]
        if ms:
            rank_rows.append([label] + line(ms))
    hour_rows = []
    for label, test in (("Avant 20 h", lambda m: m["date"].hour < 20), ("20 h - 22 h", lambda m: 20 <= m["date"].hour < 22),
                        ("Après 22 h", lambda m: m["date"].hour >= 22)):
        ms = [m for m in matches.values() if test(m)]
        if ms:
            hour_rows.append([label] + line(ms))
    days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
    day_rows = [[days[d]] + line([m for m in matches.values() if m["date"].weekday() == d])
                for d in range(7) if any(m["date"].weekday() == d for m in matches.values())]
    lineup_rows = []
    for names, mids in Counter(frozenset(v) for v in lineups.values()).most_common():
        ms = [matches[mid] for mid, v in lineups.items() if frozenset(v) == names and mid in matches]
        lineup_rows.append([esc(", ".join(sorted(names, key=str.lower)))] + line(ms))
    everyone = sorted({n for v in lineups.values() for n in v}, key=str.lower)
    presence_rows = []
    for name in everyone:
        with_p = [matches[mid] for mid, v in lineups.items() if name in v and mid in matches]
        without = [matches[mid] for mid, v in lineups.items() if name not in v and mid in matches]
        if without:
            presence_rows.append([esc(name)] + line(with_p) + line(without))
    return "".join([
        '<div class="cols"><div class="col"><h3>Rang du match dans la soirée</h3>',
        table(["", "Matchs", "V-D", "Rounds gagnés"], rank_rows),
        "<h3>Heure de début</h3>", table(["", "Matchs", "V-D", "Rounds gagnés"], hour_rows),
        '</div><div class="col"><h3>Jour</h3>', table(["", "Matchs", "V-D", "Rounds gagnés"], day_rows), "</div></div>",
        "<h3>Lineups</h3>", table(["Les 5 joueurs", "Matchs", "V-D", "Rounds gagnés"], lineup_rows),
        "<h3>Avec ou sans chaque joueur</h3>",
        table(["Joueur", "Matchs avec", "V-D", "Rounds gagnés", "Matchs sans", "V-D", "Rounds gagnés"], presence_rows)])


def compositions(now_pm, top_pm):
    """Agent compositions per map: yours with results, and the most played one in top ranked games."""
    def comps(rows, label):
        by = defaultdict(list)
        for p in rows:
            if p["team"] == label:
                by[(p["match"], p["team_id"])].append(p)
        out = defaultdict(list)
        for players in by.values():
            if len(players) == 5:
                out[players[0]["map"]].append((tuple(sorted(p["agent"] for p in players)), players[0]["won"]))
        return out

    mine, top = comps(now_pm, "squad"), comps(top_pm, "top")
    rows = []
    for map_name in sorted(mine, key=lambda m: -len(mine[m])):
        counts = Counter(c for c, _ in mine[map_name])
        top_comp = Counter(c for c, _ in top.get(map_name, [])).most_common(1)
        top_txt = (f"{', '.join(top_comp[0][0])} ({pct(top_comp[0][1], len(top[map_name]))} des équipes)" if top_comp else "-")
        for i, (comp, n) in enumerate(counts.most_common(3)):
            wins = sum(w for c, w in mine[map_name] if c == comp)
            rows.append([esc(map_name) if i == 0 else "", esc(", ".join(comp)), n, f"{wins}-{n - wins}", esc(top_txt) if i == 0 else ""])
    return table(["Carte", "Votre composition", "Matchs", "V-D", "La plus jouée en top ranked"], rows, numeric_from=2)


def revenge_matrix(now_d):
    """Who avenges whom: rows are the players who died, columns the teammate who took the revenge."""
    deaths = [d for d in now_d if d["team"] == "squad"]
    names = [n for n, _ in Counter(d["name"] for d in deaths).most_common()]
    rows = []
    for victim in names:
        mine = [d for d in deaths if d["name"] == victim]
        by = Counter(d["avenger"] for d in mine if d["avenger"])
        cells = [f'<td class="num muted">·</td>' if a == victim else f'<td class="num">{by.get(a, 0) or ""}</td>' for a in names]
        rows.append([esc(victim)] + cells + [pct(sum(by.values()), len(mine))])
    return ('<p class="small">Lignes : le joueur mort. Colonnes : le coéquipier qui a pris la revenge. Dernière colonne : part de ses morts avec revenge.</p>'
            + table(["Mort \\ revenge par"] + names + ["Avec revenge"], rows))


def opening_by_player(now_pr, top_r):
    """Each player's opening duels and what they mean for the round."""
    conv = rate((r for r in top_r if r["first_kill"] is True), lambda r: r["won"])
    rec = rate((r for r in top_r if r["first_kill"] is False), lambda r: r["won"])
    conv_c, rec_c = conv[0] / conv[1], rec[0] / rec[1]
    rows = []
    sq = [p for p in now_pr if p["team"] == "squad"]
    for name, _ in Counter(p["name"] for p in sq).most_common():
        mine = [p for p in sq if p["name"] == name]
        fb, fd = [p for p in mine if p["fb"]], [p for p in mine if p["fd"]]
        rows.append([esc(name), len(fb), heat(*rate(fb, lambda p: p["won"]), center=conv_c, span=0.2), len(fd),
                     heat(*rate(fd, lambda p: p["won"]), center=rec_c, span=0.2), pct(*rate(fd, lambda p: p["traded"]))])
    return (f'<p class="small">Rounds gagnés par l\'équipe après le first blood ou la first death de chaque joueur. Couleur : par rapport au top ranked '
            f"({pct(*conv)} après un first blood, {pct(*rec)} après une first death).</p>"
            + table(["Joueur", "First bloods", "Round gagné ensuite", "First deaths", "Round gagné ensuite", "First deaths avec revenge"], rows))
