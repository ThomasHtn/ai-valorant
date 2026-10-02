"""Period report: what happened, strengths and weaknesses against same-elo opponents, evolution."""
from collections import Counter
from datetime import datetime, timedelta

from .charts import CHART_CSS, SCRIPT
from .data import OUT
from .facts import TZ, extract, player_rounds
from .page import esc, page, pct, point, points, round_ref
from .insights import compositions, correlations, opening_by_player, revenge_matrix, round_drivers, sessions_context
from .maps import map_tab
from .players import MIN_ROUNDS, STATS, benchmark_by_agent, player_tab, roster_table, weapon_benchmark
from .team import clutches, economy, form, kpis, map_pool, opening, situations, sites
from .top import top_facts
from .stats import confirmed, one_proportion, two_proportions

MIN_N = 15
MAX_REFS = 6
MAX_PER_METRIC = 2

# Each metric: rows it applies to, success predicate, label; "fail" rows are the ones to rewatch.
# vs_half: the opponents' rate on the same side mirrors ours on the other side, so these are tested against 50 %.
# both_sides: only meaningful over both sides (attack wins more than defense). mirror: the opponents' rate equals
# 1 - another of our metrics (recover vs convert, post-plant vs retake), so it is kept for the evolution only.
ROUND_METRICS = [
    {"key": "won", "short": "Rounds gagnés",
     "subset": lambda r: True, "ok": lambda r: r["won"], "better": True, "unit": "rounds", "vs_half": True, "both_sides": True},
    {"key": "first_duel", "short": "First blood pris",
     "subset": lambda r: r["first_kill"] is not None, "ok": lambda r: r["first_kill"], "better": True, "unit": "rounds", "vs_half": True},
    {"key": "convert", "short": "Round gagné après le first blood (5v4)",
     "subset": lambda r: r["first_kill"] is True, "ok": lambda r: r["won"], "better": True, "unit": "rounds"},
    {"key": "recover", "short": "Round gagné après la first death (4v5)",
     "subset": lambda r: r["first_kill"] is False, "ok": lambda r: r["won"], "better": True, "unit": "rounds", "mirror": True},
    {"key": "adv_lost", "short": "Throw en avantage de 2+ (5v3, 4v2…)",
     "subset": lambda r: r["max_adv"] >= 2, "ok": lambda r: not r["won"], "better": False, "unit": "rounds"},
    {"key": "post_plant", "side": "att", "short": "Post-plant gagné",
     "subset": lambda r: r["planted"], "ok": lambda r: r["won"], "better": True, "unit": "rounds", "mirror": True},
    {"key": "retake", "side": "def", "short": "Retake réussi",
     "subset": lambda r: r["planted"], "ok": lambda r: r["won"], "better": True, "unit": "rounds"},
    {"key": "no_plant", "side": "att", "short": "Rounds d'attaque sans plant (hors eco)",
     "subset": lambda r: r["buy"] != "eco", "ok": lambda r: not r["planted"], "better": False, "unit": "rounds"},
]
DEATH_METRICS = [
    {"key": "traded", "short": "Morts avec revenge",
     "subset": lambda d: True, "ok": lambda d: d["traded"], "better": True, "unit": "morts"},
    {"key": "no_damage", "short": "Morts à 0 dégât",
     "subset": lambda d: True, "ok": lambda d: d["damage"] == 0, "better": False, "unit": "morts"},
]


MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]
MIN_BEFORE_MATCHES = 5


def select(spec, rounds):
    """Period from 'YYYY-MM', 'patch X.YY' or 'YYYY-MM-DD YYYY-MM-DD' (default: latest month), and the previous comparable period."""
    squad_rounds = [r for r in rounds if r["team"] == "squad"]
    if not spec:
        spec = [f"{max(r['date'] for r in squad_rounds):%Y-%m}"]
    if spec[0] == "patch":
        patches = sorted({r["patch"] for r in squad_rounds}, key=lambda p: tuple(int(x) for x in p.split(".")))
        prev = patches[patches.index(spec[1]) - 1] if spec[1] in patches and patches.index(spec[1]) > 0 else None
        return (f"Patch {spec[1]}", f"patch-{spec[1]}", lambda r: r["patch"] == spec[1],
                lambda r: r["patch"] == prev, f"vs patch {prev}" if prev else "")
    if len(spec) == 2:
        start = datetime.fromisoformat(spec[0]).replace(tzinfo=TZ)
        end = datetime.fromisoformat(spec[1]).replace(tzinfo=TZ) + timedelta(days=1)
        length = end - start
        return (f"Du {start:%d/%m/%Y} au {end - timedelta(days=1):%d/%m/%Y}", f"{spec[0]}_{spec[1]}", lambda r: start <= r["date"] < end,
                lambda r: start - length <= r["date"] < start, f"vs les {length.days} jours précédents")
    month = spec[0]
    year, mon = int(month[:4]), int(month[5:7])
    prev = f"{year - (mon == 1)}-{12 if mon == 1 else mon - 1:02d}"
    return (f"{MONTHS[mon - 1].capitalize()} {year}", month, lambda r: f"{r['date']:%Y-%m}" == month,
            lambda r: f"{r['date']:%Y-%m}" == prev, f"vs {MONTHS[int(prev[5:7]) - 1]}")


SIDE_FR = {"att": "Attaque", "def": "Défense"}


def scopes(maps):
    """(map, side, chip label) for every comparison scope."""
    out = [(None, None, "Toutes cartes"), (None, "att", "Attaque"), (None, "def", "Défense")]
    out += [(m, None, m) for m in maps]
    out += [(m, s, f"{m} · {SIDE_FR[s]}") for m in maps for s in ("att", "def")]
    return out


def squad_side(death):
    if death["team"] == "squad":
        return death["side"]
    return "def" if death["side"] == "att" else "att"


def comparisons(rounds, deaths):
    """Squad vs opponents of the same matches, for every metric and scope with enough data."""
    tests = []
    maps = sorted({r["map"] for r in rounds})
    for map_name, side, chip in scopes(maps):
        in_scope = lambda x, s=side: (map_name is None or x["map"] == map_name) and (s is None or x["side"] == s)
        for metric, rows, kind in [(m, rounds, "round") for m in ROUND_METRICS] + [(m, deaths, "death") for m in DEATH_METRICS]:
            if metric.get("side") and metric["side"] != side or metric.get("mirror") or metric.get("both_sides") and side:
                continue
            # Per-map scope without a side only carries the round win rate; side scopes say the rest more precisely.
            if map_name and side is None and not metric.get("both_sides"):
                continue
            sel = [x for x in rows if in_scope(x) and metric["subset"](x)]
            sq = [x for x in sel if x["team"] == "squad"]
            op = [x for x in sel if x["team"] == "opp"]
            add_test(tests, chip, metric["short"], metric, sq, op, key=metric["key"])
    names = sorted({d["name"] for d in deaths if d["team"] == "squad"})
    openings = [d for d in deaths if d["opening"]]
    for name in names:
        mine = [d for d in openings if name in (d["name"], d["killer"])]
        add_test(tests, name, "Duels d'ouverture gagnés", {"better": True, "unit": "duels", "ok": lambda d, n=name: d["killer"] == n},
                 mine, openings, opp_ok=lambda d: d["killer_team"] == "opp", key=f"{name}-opening", name=name)
        own = [d for d in deaths if d["team"] == "squad" and d["name"] == name]
        opp = [d for d in deaths if d["team"] == "opp"]
        add_test(tests, name, DEATH_METRICS[0]["short"], DEATH_METRICS[0], own, opp, key=f"{name}-traded", name=name)
        add_test(tests, name, DEATH_METRICS[1]["short"], DEATH_METRICS[1], own, opp, key=f"{name}-no_damage", name=name)
    return tests


def add_test(tests, chip, short, metric, sq, op, opp_ok=None, key=None, name=None):
    ok = metric["ok"]
    k1, n1 = sum(map(bool, map(ok, sq))), len(sq)
    if metric.get("vs_half"):
        if n1 < MIN_N:
            return
        k2, n2, p = None, None, one_proportion(k1, n1)
        ref = 0.5
    else:
        k2, n2 = sum(map(bool, map(opp_ok or ok, op))), len(op)
        if n1 < MIN_N or n2 < MIN_N:
            return
        p, ref = two_proportions(k1, n1, k2, n2), k2 / n2
    fails = [x for x in sq if bool(ok(x)) != metric["better"]]
    tests.append({"chip": chip, "short": short, "sq": (k1, n1), "op": (k2, n2), "good": (k1 / n1 > ref) == metric["better"],
                  "unit": metric["unit"], "p": p, "fails": fails, "effect": abs(k1 / n1 - ref), "key": key, "player": name is not None, "name": name})


def refs_line(rows, who=None):
    refs = sorted(rows, key=lambda x: x["date"], reverse=True)[:MAX_REFS]
    label = f"À revoir ({who})" if who else "À revoir"
    return f"{label} : {', '.join(dict.fromkeys(round_ref(x) for x in refs))}" if refs else ""


def finding_card(t, status):
    (k1, n1), (k2, n2) = t["sq"], t["op"]
    versus = f"adversaires {pct(k2, n2)} · " if n2 else ""
    details = [f"{versus}sur {n1} {t['unit']}", None if t["good"] else refs_line(t["fails"])]
    return point([t["chip"], status], f"{t['short']} : {pct(k1, n1)}", details, "good" if t["good"] else "bad")


def grouped_card(ts, good, status_of):
    """Several players sharing the same point, in one card."""
    k2, n2 = ts[0]["op"]
    statuses = {status_of(t) for t in ts}
    values = ", ".join(f"{t['name']} {pct(*t['sq'])}" for t in ts)
    details = [f"{values} · adversaires {pct(k2, n2)}"]
    if not good:
        details += [refs_line(t["fails"], t["name"]) for t in ts]
    return point([*(t["name"] for t in ts), statuses.pop() if len(statuses) == 1 else "confirmé ou piste"], ts[0]["short"], details,
                 "good" if good else "bad")


def recurring_spots(deaths):
    """Callouts where the squad keeps dying first, per map and side."""
    sq = [d for d in deaths if d["team"] == "squad" and d["opening"] and not d["teamkill"]]
    groups = Counter((d["map"], d["side"], d["callout"]) for d in sq)
    items = []
    for (map_name, side, spot), n in groups.most_common(8):
        if n < 4:
            break
        ds = [d for d in sq if (d["map"], d["side"], d["callout"]) == (map_name, side, spot)]
        who = ", ".join(f"{name} {c}" for name, c in Counter(d["name"] for d in ds).most_common())
        revenges = sum(d["traded"] for d in ds)
        items.append(point([f"{map_name} · {SIDE_FR[side]}"], f"{n} first deaths à {spot}",
                           [f"{who} · revenge {revenges}/{n}", refs_line(ds)], "bad"))
    return items


def evolution(now_rounds, now_deaths, before_rounds, before_deaths):
    """Key squad metrics in the period against the previous comparable period."""
    if not before_rounds:
        return '<p class="muted">Pas de matchs avant cette période : rien à comparer.</p>'
    lines = []
    for scope, side, label in ((None, None, "Toutes cartes"), ("att", "att", "En attaque"), ("def", "def", "En défense")):
        for metric, now, before in [(m, now_rounds, before_rounds) for m in ROUND_METRICS] + [(m, now_deaths, before_deaths) for m in DEATH_METRICS]:
            if metric.get("side") and metric["side"] != side:
                continue
            pick = lambda rows: [x for x in rows if x["team"] == "squad" and (side is None or x["side"] == side) and metric["subset"](x)]
            a, b = pick(now), pick(before)
            if len(a) < MIN_N or len(b) < MIN_N:
                continue
            k1, k2 = sum(bool(metric["ok"](x)) for x in a), sum(bool(metric["ok"](x)) for x in b)
            lines.append({"label": label, "short": metric["short"], "now": (k1, len(a)), "before": (k2, len(b)),
                          "better": (k1 / len(a) > k2 / len(b)) == metric["better"], "p": two_proportions(k1, len(a), k2, len(b))})
    net = {id(t) for t in confirmed(lines)}
    cards = [point([t["label"]], f"{t['short']} : {pct(*t['before'])} → {pct(*t['now'])}", ["changement net par rapport à la période de comparaison"],
                   "good" if t["better"] else "bad") for t in lines if id(t) in net]
    rows = []
    for t in lines:
        diff = round(100 * (t["now"][0] / t["now"][1] - t["before"][0] / t["before"][1]))
        cls = ("good" if t["better"] else "bad") if id(t) in net else ""
        mark = " (net)" if id(t) in net else ""
        change = "=" if diff == 0 else f"{diff:+d} pts"
        rows.append(f"<tr><td>{esc(t['label'])}</td><td>{esc(t['short'])}</td><td>{pct(*t['now'])}</td><td>{pct(*t['before'])}</td>"
                    f'<td class="{cls}">{change}{mark}</td></tr>')
    return (points(cards, "Aucun changement net par rapport à vos matchs précédents.")
            + '<details><summary>Tous les indicateurs</summary><div class="table-wrap"><table><tr><th></th><th>Indicateur</th>'
            '<th>Cette période</th><th>Avant</th><th>Écart</th></tr>' + "".join(rows) + "</table></div></details>")


def build(matches, squad, spec):
    rounds, deaths = extract(matches, squad)
    deaths = [d for d in deaths if not d["teamkill"]]
    title, slug, in_period, before, before_label = select(spec, rounds)
    now_r = [r for r in rounds if in_period(r)]
    now_d = [d for d in deaths if in_period(d)]
    if not now_r:
        raise SystemExit(f"No squad match in period {title}.")
    # Too few matches in the previous comparable period: compare to the whole history before this one.
    if len({r["match"] for r in rounds if r["team"] == "squad" and before(r)}) < MIN_BEFORE_MATCHES:
        first = min(r["date"] for r in now_r)
        before, before_label = (lambda r: r["date"] < first), "vs tout l'historique avant"
    tests = comparisons(now_r, now_d)
    sure = {id(t) for t in confirmed(tests)}
    shown = [t for t in tests if id(t) in sure or t["p"] < 0.05]
    shown.sort(key=lambda t: (id(t) not in sure, -t["effect"]))

    status_of = lambda t: "confirmé" if id(t) in sure else "piste"

    def findings(good, player):
        items, per_key = [], Counter()
        selected = [t for t in shown if t["good"] == good and t["player"] == player]
        if player:
            # Several players sharing the same point become one card.
            by_family = {}
            for t in selected:
                by_family.setdefault(t["key"].rsplit("-", 1)[1], []).append(t)
            for ts in by_family.values():
                items.append(finding_card(ts[0], status_of(ts[0])) if len(ts) == 1 else grouped_card(ts, good, status_of))
        else:
            for t in selected:
                if per_key[t["key"]] < MAX_PER_METRIC:
                    per_key[t["key"]] += 1
                    items.append(finding_card(t, status_of(t)))
        return items

    n_matches = len({r["match"] for r in now_r if r["team"] == "squad"})
    weak_team, weak_players = findings(False, False), findings(False, True)
    strong_team, strong_players = findings(True, False), findings(True, True)
    spots = recurring_spots(now_d)
    # Summary: titles of the first weaknesses and strengths, plus the worst first-death spot.
    versus = lambda t: f' <span class="muted">(adversaires {pct(*t["op"])})</span>' if t["op"][1] else ""
    key = lambda t: (f'<li><strong>{esc(t["chip"])}</strong> · {esc(t["short"])} : '
                     f'<span class="{"good" if t["good"] else "bad"}">{pct(*t["sq"])}</span>{versus(t)}</li>')
    top_weak = [t for t in shown if not t["good"]][:3]
    top_strong = [t for t in shown if t["good"]][:2]
    summary = "".join(key(t) for t in top_weak)
    summary += "".join(key(t) for t in top_strong)
    first_spot = Counter((d["map"], d["side"], d["callout"]) for d in now_d if d["team"] == "squad" and d["opening"]).most_common(1)
    if first_spot and first_spot[0][1] >= 4:
        (mp, side, spot), n = first_spot[0]
        summary += f'<li><strong>{esc(mp)} · {SIDE_FR[side]}</strong> · <span class="bad">{n} first deaths à {esc(spot)}</span></li>'

    player_rows, player_matches = player_rounds(matches, squad)
    now_pr = [r for r in player_rows if in_period(r)]
    before_pr = [r for r in player_rows if before(r)]
    now_pm = [m for m in player_matches if in_period(m)]
    before_r = [r for r in rounds if before(r)]
    top = top_facts()
    top_r, top_d, top_pr, top_pm = top["rounds"], top["deaths"], top["players"], top["player_matches"]
    top_by_agent = benchmark_by_agent(top_pr)
    top_weapons = weapon_benchmark(top_pr)
    squad_pr = [r for r in now_pr if r["team"] == "squad"]
    names = [n for n, c in Counter(r["name"] for r in squad_pr).most_common() if c >= MIN_ROUNDS]
    tab_ids = {n: f"p{i}" for i, n in enumerate(names)}

    intro = [f"<h1>{esc(title)}</h1>", kpis(now_r, now_pr, before_r, before_pr, before_label),
             f'<div class="card summary"><h3>À retenir</h3><ul>{summary or "<li>Rien de net sur cette période.</li>"}</ul></div>',
             '<p class="small">Points forts et faibles : comparés aux adversaires de vos propres matchs (même niveau). « confirmé » : écart '
             f"assez net pour ne pas être dû au hasard ; « piste » : à surveiller. Avec {n_matches} matchs, les écarts par carte restent souvent "
             f"des pistes. Sections de jeu : comparées au top ranked ({top['matches']} matchs du top 20 de chaque région), car vos adversaires "
             "y seraient le reflet exact de vos propres chiffres. Survoler une case colorée pour le détail.</p>"]
    two_cols = lambda left, right: (f'<div class="cols"><div class="col"><h3>Équipe</h3>{points(left, "Rien de net sur cette période.")}</div>'
                                    f'<div class="col"><h3>Joueurs</h3>{points(right, "Rien de net sur cette période.")}</div></div>')
    team_sections = [
        ("form", "Forme", form(now_r)),
        ("pool", "Map pool", map_pool(now_r)),
        ("weak", "Points faibles", two_cols(weak_team, weak_players)),
        ("strong", "Points forts", two_cols(strong_team, strong_players)),
        ("drivers", "Ce qui fait gagner vos rounds", round_drivers(now_r, now_d, top_r, top_d)),
        ("corr", "Ce qui va avec vos victoires", correlations(now_r, now_d, now_pr, now_pm)),
        ("eco", "Économie", economy(now_r, top_r)),
        ("opening", "Duels d'ouverture", opening(now_r, now_pr, top_r) + "<h3>Par joueur</h3>" + opening_by_player(now_pr, top_r)),
        ("states", "Situations numériques", situations(now_r, top_r)),
        ("sites", "Plants et retakes", sites(now_r, top_r)),
        ("clutch", "Clutchs", clutches(now_pr, top_pr)),
        ("revenge", "Qui venge qui", revenge_matrix(now_d)),
        ("comps", "Compositions", compositions(now_pm, top_pm)),
        ("context", "Contexte des soirées", sessions_context(now_r, now_pr)),
        ("spots", "First deaths récurrentes", points(spots, "Aucune position ne revient au moins 4 fois.")),
        ("roster", "Joueurs", roster_table(squad_pr, top_by_agent, tab_ids)),
        ("evolution", f"Évolution {before_label}", evolution(now_r, now_d, before_r, [d for d in deaths if before(d)])),
    ]
    toc = '<ol class="toc">' + "".join(f'<li><a href="#{sid}">{esc(t)}</a></li>' for sid, t, _ in team_sections) + "</ol>"
    team = intro + ['<details open><summary>Sommaire</summary>' + toc + "</details>"]
    team += [f'<h2 id="{sid}">{esc(t)}</h2>{html}' for sid, t, html in team_sections]

    map_names = [m for m, _ in Counter(r["map"] for r in now_r if r["team"] == "squad").most_common()]
    map_ids = {m: f"map-{i}" for i, m in enumerate(map_names)}
    map_sections = []
    for m in map_names:
        # Team findings scoped to this map, as cards.
        cards = [finding_card(t, status_of(t)) for t in shown if not t["player"] and t["chip"].startswith(m)]
        map_sections.append(f'<section class="tab" id="{map_ids[m]}"{"" if m == map_names[0] else " hidden"}>'
                            + map_tab(m, now_r, now_d, now_pr, now_pm, top_r, top_pm, cards) + "</section>")
    maps_group = ('<nav class="tabs sub" role="tablist">' + "".join(
        f'<button data-tab="{map_ids[m]}" aria-selected="{"true" if i == 0 else "false"}">{esc(m)}</button>' for i, m in enumerate(map_names))
        + "</nav>" + "".join(map_sections))

    opp_pr = [r for r in now_pr if r["team"] == "opp"]
    player_sections = []
    for i, n in enumerate(names):
        mine = [r for r in squad_pr if r["name"] == n]
        player_sections.append(f'<section class="tab" id="{tab_ids[n]}"{"" if i == 0 else " hidden"}>'
                               + player_tab(n, mine, opp_pr, top_by_agent, [r for r in before_pr if r["team"] == "squad" and r["name"] == n], before_label,
                                            [m for m in now_pm if m["team"] == "squad" and m["name"] == n], top_pm, top_weapons) + "</section>")
    players_group = ('<nav class="tabs sub" role="tablist">' + "".join(
        f'<button data-tab="{tab_ids[n]}" aria-selected="{"true" if i == 0 else "false"}">{esc(n)}</button>' for i, n in enumerate(names))
        + "</nav>" + "".join(player_sections))

    tabs = ['<nav class="tabs" role="tablist"><button data-tab="team" aria-selected="true">Équipe</button>'
            '<button data-tab="maps" aria-selected="false">Cartes</button><button data-tab="players" aria-selected="false">Joueurs</button>'
            '<button data-tab="glossary" aria-selected="false">Glossaire</button>'
            f'<span class="muted" style="margin-left:auto;align-self:center;font-size:13px">{esc(title)}</span></nav>']
    sections = [f'<section class="tab" id="team">{"".join(team)}</section>',
                f'<section class="tab" id="maps" hidden><h1>Cartes</h1>{maps_group}</section>',
                f'<section class="tab" id="players" hidden><h1>Joueurs</h1>{players_group}</section>',
                f'<section class="tab" id="glossary" hidden>{glossary()}</section>']
    body = tabs + sections
    OUT.mkdir(exist_ok=True)
    path = OUT / f"period-{slug}.html"
    path.write_text(page(title, "".join(body), CHART_CSS, SCRIPT))
    return path


GLOSSARY = [
    ("Revenge", "Un coéquipier tue votre tueur dans les 3 secondes qui suivent votre mort."),
    ("First blood (FB) / first death (FD)", "Premier kill du round, gagné (FB) ou subi (FD)."),
    ("Throw", "Round perdu alors que vous avez eu au moins 2 joueurs d'avance (5v3, 4v2…)."),
    ("Comeback", "Round gagné alors que vous avez été à 2 joueurs de moins ou pire."),
    ("Post-plant / retake", "Round après un plant : en attaque (post-plant), en défense (retake)."),
    ("Full buy / force buy / eco", "Équipement moyen de l'équipe : 3 700 et plus / entre 1 500 et 3 700 / moins de 1 500 (seuils calés sur la répartition réelle des achats). Pistol : rounds 1 et 13."),
    ("Top ranked", "Les 20 meilleurs joueurs du leaderboard de chaque région (EU, NA, AP, KR, BR, LATAM) et leurs matchs compétitifs récents."),
    ("Confirmé / piste", "Confirmé : l'écart passe un test statistique corrigé pour le nombre de comparaisons. Piste : écart à surveiller, qui peut être du hasard."),
] + [(label, definition) for _, label, _, _, _, definition in STATS]


def glossary():
    items = "".join(f"<dt>{esc(term)}</dt><dd>{esc(text)}</dd>" for term, text in GLOSSARY)
    return f'<h1>Glossaire</h1><dl class="glossary">{items}</dl>'

