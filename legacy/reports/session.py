"""Session report: what happened on one evening, read against the squad's history on each map."""
from collections import Counter
from datetime import timedelta

from .charts import CHART_CSS, table
from .data import OUT
from .facts import TRADE_WINDOW_MS, callout, extract, player_rounds, round_timelines, squad_team, started, win_prob, win_prob_table
from .page import BUY_FR, MAP_LEGEND, esc, join_fr, page, pct, svg_kill
from .players import fmt, mean, roster_table, values

SESSION_GAP = timedelta(hours=3)
MIN_HISTORY = 8
# A lost round only counts as a throw if the squad was clearly favoured at some point.
THROW_MIN_CHANCE = 0.65


def sessions(matches, squad):
    """Squad 5-stacks grouped into evenings: a new session starts after a 3 h gap."""
    out = []
    for m in (m for m in matches if squad_team(m, squad)):
        if out and started(m) - started(out[-1][-1]) <= SESSION_GAP:
            out[-1].append(m)
        else:
            out.append([m])
    return out


def history(rounds, deaths, exclude):
    """Squad habits per (map, side), excluding the session's matches."""
    rounds = [r for r in rounds if r["team"] == "squad" and r["match"] not in exclude]
    deaths = [d for d in deaths if d["match"] not in exclude and not d["teamkill"]]
    prof = {}
    for key in {(r["map"], r["side"]) for r in rounds}:
        rs = [r for r in rounds if (r["map"], r["side"]) == key]
        sq = [d for d in deaths if d["team"] == "squad" and (d["map"], d["side"]) == key]
        openings = [d for d in deaths if d["opening"] and d["map"] == key[0] and squad_side(d) == key[1]]
        planted = [r for r in rs if r["planted"]]
        n_matches = len({r["match"] for r in rs})
        prof[key] = {
            "matches": n_matches,
            "opening_won": (sum(d["killer_team"] == "squad" for d in openings), len(openings)),
            "traded": (sum(d["traded"] for d in sq), len(sq)),
            "plant_won": (sum(r["won"] for r in planted), len(planted)),
            "adv_lost_per_match": sum(r["max_adv"] >= 2 and not r["won"] for r in rs) / max(1, n_matches),
            "spots": Counter(d["callout"] for d in sq if d["opening"]),
            "player_spots": Counter((d["callout"], d["name"]) for d in sq if d["opening"]),
        }
    return prof


def squad_side(death):
    """Side of the squad in the round of this death."""
    if death["team"] == "squad":
        return death["side"]
    return "def" if death["side"] == "att" else "att"


def differs(tonight, usual, threshold=0.15, min_n=5):
    (k, n), (bk, bn) = tonight, usual
    return n >= min_n and bn >= MIN_HISTORY and abs(k / n - bk / bn) >= threshold


def clock(ms):
    sec = round(ms / 1000)
    return f"{sec // 60}:{sec % 60:02d}"


def revenge_short(k, n):
    return f"revenge {k}/{n}"


def map_findings(m, rounds, deaths, prof):
    """Recurring mistakes and unusual results for one match, as short points."""
    map_name = m["metadata"]["map"]["name"]
    mid = m["metadata"]["match_id"]
    recurrent, unusual = [], []
    for side in ("att", "def"):
        p = prof.get((map_name, side))
        rs = [r for r in rounds if r["match"] == mid and r["team"] == "squad" and r["side"] == side]
        if not p or not rs:
            continue
        habit = f"déjà {{n}} fois sur vos {p['matches']} autres {map_name}"
        ds = [d for d in deaths if d["match"] == mid and not d["teamkill"]]
        sq = [d for d in ds if d["team"] == "squad" and d["side"] == side]
        flagged = set()
        for (spot, name), n_hist in p["player_spots"].most_common():
            tonight = [d for d in sq if d["opening"] and d["callout"] == spot and d["name"] == name]
            if n_hist >= 4 and tonight:
                flagged.add(spot)
                recurrent.append({"side": side, "tone": "bad", "title": f"First death de {name} à {spot}",
                                  "detail": " · ".join([", ".join(f"R{d['round'] + 1}" for d in tonight),
                                                        revenge_short(sum(d["traded"] for d in tonight), len(tonight)), habit.format(n=n_hist)])})
        for spot, n_hist in p["spots"].most_common():
            tonight = [d for d in sq if d["opening"] and d["callout"] == spot]
            if n_hist >= 5 and len(tonight) >= 2 and spot not in flagged:
                recurrent.append({"side": side, "tone": "bad", "title": f"{len(tonight)} first deaths à {spot}",
                                  "detail": " · ".join([", ".join(f"{d['name']} R{d['round'] + 1}" for d in tonight),
                                                        revenge_short(sum(d["traded"] for d in tonight), len(tonight)), habit.format(n=n_hist)])})

        def compare(title, now, usual, better=True):
            if differs(now, usual):
                up = now[0] / now[1] > usual[0] / usual[1]
                unusual.append({"side": side, "tone": "good" if up == better else "bad", "title": title,
                                "detail": f"d'habitude {pct(*usual)} sur {map_name}"})

        openings = [d for d in ds if d["opening"] and squad_side(d) == side]
        o = (sum(d["killer_team"] == "squad" for d in openings), len(openings))
        compare(f"First blood : {o[0]}/{o[1]}", o, p["opening_won"])
        t = (sum(d["traded"] for d in sq), len(sq))
        compare(f"Revenge : {t[0]}/{t[1]} morts", t, p["traded"])
        planted = [r for r in rs if r["planted"]]
        pw = (sum(r["won"] for r in planted), len(planted))
        compare(f"{'Retakes' if side == 'def' else 'Post-plants'} : {pw[0]}/{pw[1]}", pw, p["plant_won"])
        lost_adv = [r for r in rs if r["max_adv"] >= 2 and not r["won"]]
        if len(lost_adv) >= max(2, round(p["adv_lost_per_match"] * 2)):
            usual = "moins d'une fois" if p["adv_lost_per_match"] < 1 else f"environ {p['adv_lost_per_match']:.0f} fois"
            refs = ", ".join(f"R{r['round'] + 1}" for r in lost_adv)
            unusual.append({"side": side, "tone": "bad", "title": f"{len(lost_adv)} throws en avantage 2+ (5v3, 4v2…)",
                            "detail": f"{refs} · d'habitude {usual} par match"})
    return recurrent, unusual


ENDING_FR = {"Detonate": "le spike explose", "Defuse": "l'adversaire defuse", "Elimination": "toute l'équipe est éliminée"}


def explain(side, steps, deaths_after, final_result, planted_at_peak):
    """Headline and short explanations of how a favourable round was lost, from the events after the peak."""
    notes, headline = [], None
    if planted_at_peak:
        headline = "Post-plant perdu" if side == "att" else "Retake raté en supériorité"
    plant = next((s for s in steps if s["kind"] == "plant"), None)
    if plant and not plant["ours"] and side == "def":
        notes.append(f"L'adversaire plante {plant['site']} à {plant['time']} alors que vous êtes en {plant['before']}.")
        if plant["adv"] > 0:
            headline = headline or "Retake raté en supériorité"
    if plant and plant["ours"]:
        notes.append(f"Vous plantez {plant['site']} à {plant['time']} en {plant['before']}.")
        if plant["adv"] >= 0:
            headline = headline or "Post-plant perdu"
    spots = Counter(d["spot"] for d in deaths_after)
    spot, n_spot = spots.most_common(1)[0] if spots else (None, 0)
    if n_spot >= 3:
        same = [d for d in deaths_after if d["spot"] == spot]
        span = round((same[-1]["ms"] - same[0]["ms"]) / 1000)
        notes.append(f"{join_fr(d['name'] for d in same)} meurent tous à {spot}, en {span} s.")
        headline = headline or (f"Entrée qui tourne mal à {spot}" if side == "att" else f"{spot} tombe d'un coup")
    elif len(deaths_after) >= 3 and len(spots) >= 3:
        revenges = sum(d["revenge"] for d in deaths_after)
        rv = "aucune revenge" if revenges == 0 else "une seule revenge" if revenges == 1 else f"{revenges} revenges"
        notes.append(f"Vous perdez {len(deaths_after)} joueurs à {len(spots)} endroits différents ({join_fr(spots)}), avec {rv} : "
                     "personne n'était là pour reprendre le duel.")
        headline = headline or "Avantage perdu en duels isolés"
    killers = Counter(d["killer"] for d in deaths_after)
    top, n_top = killers.most_common(1)[0] if killers else (None, 0)
    if n_top >= 3:
        notes.append(f"{top} fait {n_top} kills à lui seul.")
        headline = headline or f"{top} retourne le round"
    last = deaths_after[-1] if deaths_after else None
    if last and last["alone_vs"]:
        notes.append(f"{last['name']} se retrouve seul en 1v{last['alone_vs']} et perd le clutch.")
        headline = headline or "Clutch perdu"
    notes.append(f"Fin du round : {ENDING_FR.get(final_result, 'le temps est écoulé')}.")
    return headline or "Avantage perdu", notes


def costly_rounds(m, rounds, sq_team, wp_table, limit=3):
    """Lost rounds where the squad reached the highest chance of winning, with what went wrong."""
    map_name = m["metadata"]["map"]["name"]
    mid = m["metadata"]["match_id"]
    other = "Blue" if sq_team == "Red" else "Red"
    results = {r["id"]: r["result"] for r in m["rounds"]}
    candidates = []
    for idx, tl in round_timelines(m).items():
        if tl["winner"] == sq_team:
            continue
        side = "att" if tl["att"] == sq_team else "def"
        best, best_i, drop, turning, prev = 0, 0, 0, None, None
        for i, (ev, _, alive, planted) in enumerate(tl["states"]):
            w = win_prob(wp_table, alive[sq_team], alive[other], side, planted)
            if w > best:
                best, best_i = w, i
            if prev is not None and ev and ev[0] == "kill" and prev - w > drop:
                drop, turning = prev - w, ev[1]
            prev = w
        candidates.append((best, idx, side, best_i, turning, tl))
    out = []
    for best, idx, side, best_i, turning, tl in sorted(candidates, key=lambda c: -c[0])[:limit]:
        if best < THROW_MIN_CHANCE:
            continue
        row = next(r for r in rounds if r["match"] == mid and r["team"] == "squad" and r["round"] == idx)
        buy = BUY_FR["pistol"] if row["buy"] == "pistol" else f"{BUY_FR[row['buy']]} vs {BUY_FR[row['opp_buy']]}"
        _, ms, alive, planted = tl["states"][best_i]
        kills = [ev[1] for ev, _, _, _ in tl["states"][1:] if ev[0] == "kill"]
        steps, deaths_after = [], []
        before = alive
        for ev, t, after, _ in tl["states"][best_i + 1:]:
            kind, e = ev
            state_before = f"{before[sq_team]}v{before[other]}"
            if kind == "plant":
                ours = e["player"]["team"] == sq_team
                steps.append({"time": clock(t), "kind": "plant", "text": f"{'Vous plantez' if ours else 'Plant adverse'} sur {e['site']}",
                              "state": f"{after[sq_team]}v{after[other]}", "turning": False, "ours": ours, "site": e["site"],
                              "before": state_before, "adv": before[sq_team] - before[other]})
            elif e["victim"]["team"] == sq_team:
                spot = callout(map_name, e["location"])
                revenge = any(k2["victim"]["puuid"] == e["killer"]["puuid"] and 0 <= k2["time_in_round_in_ms"] - t <= TRADE_WINDOW_MS for k2 in kills)
                deaths_after.append({"name": e["victim"]["name"], "spot": spot, "ms": t, "killer": e["killer"]["name"], "revenge": revenge,
                                     "alone_vs": before[other] if before[sq_team] == 1 else 0})
                steps.append({"time": clock(t), "kind": "death", "state": f"{after[sq_team]}v{after[other]}", "turning": e is turning,
                              "text": f"{e['victim']['name']} meurt à {spot} (tué par {e['killer']['name']}){' · revenge' if revenge else ''}"})
            else:
                steps.append({"time": clock(t), "kind": "kill", "state": f"{after[sq_team]}v{after[other]}", "turning": False,
                              "text": f"{e['killer']['name']} tue {e['victim']['name']} à {callout(map_name, e['location'])}"})
            before = after
        headline, notes = explain(side, steps, deaths_after, results[idx], planted)
        out.append({
            "round": idx + 1, "side": side, "buy": buy, "best": best, "headline": headline, "notes": notes,
            "state": f"{alive[sq_team]}v{alive[other]}{', spike planté' if planted else ''}", "time": clock(ms),
            "steps": steps, "svg": svg_kill(map_name, turning, sq_team) if turning else "",
            "turning": f"{turning['victim']['name']} à {callout(map_name, turning['location'])}" if turning else "",
        })
    return out


SIDE_CHIP = {"att": "Attaque", "def": "Défense"}
KIND_FR = {"death": "Mort", "kill": "Kill", "plant": "Plant"}


def point_html(pt):
    return (f'<li class="point {pt["tone"]}"><span class="chip">{SIDE_CHIP[pt["side"]]}</span>'
            f'<strong>{esc(pt["title"])}</strong><span class="detail">{esc(pt["detail"])}</span></li>')


def throw_html(c):
    odds = "le round était presque gagné" if c["best"] >= 0.95 else f"environ {round(10 * c['best'])} chances sur 10 de le gagner"
    rows = "".join(f'<tr class="{s["kind"]}{" turning" if s["turning"] else ""}"><td class="t">{s["time"]}</td>'
                   f'<td><span class="kind">{KIND_FR[s["kind"]]}</span></td><td>{esc(s["text"])}</td><td class="st">{s["state"]}</td></tr>'
                   for s in c["steps"])
    notes = "".join(f"<li>{esc(n)}</li>" for n in c["notes"])
    return (f'<div class="card throw"><div class="txt">'
            f'<div class="throw-head"><span class="rnum">R{c["round"]}</span><span class="chip">{SIDE_CHIP[c["side"]]}</span>'
            f'<span class="chip">{esc(c["buy"])}</span></div>'
            f'<p class="headline">{esc(c["headline"])}</p>'
            f'<p class="why"><strong>Pourquoi ce round :</strong> à {c["time"]}, vous étiez en {esc(c["state"])}, {odds}. Vous l\'avez perdu.</p>'
            f'<ul class="notes">{notes}</ul>'
            f'<details><summary>Déroulé du round</summary><table class="timeline">{rows}</table></details>'
            + (f'<p class="small">Sur la carte : le moment où le round bascule ({esc(c["turning"])}).</p>' if c["turning"] else "")
            + f'</div>{c["svg"]}</div>')


def scoreboard(rows):
    """Squad scoreboard of one match."""
    out = []
    for name in sorted({r["name"] for r in rows}, key=lambda n: -sum(r["score"] for r in rows if r["name"] == n)):
        rs = [r for r in rows if r["name"] == name]
        acc = values(rs)
        out.append([esc(name), esc(rs[0]["agent"]), f'{sum(r["kills"] for r in rs)}/{sum(r["deaths"] for r in rs)}/{sum(r["assists"] for r in rs)}',
                    fmt("acs", mean(acc, "acs")), fmt("adr", mean(acc, "adr")), fmt("kast", mean(acc, "kast")),
                    f'{sum(r["fb"] for r in rs)}-{sum(r["fd"] for r in rs)}', fmt("impact", mean(acc, "impact"))])
    return table(["Joueur", "Agent", "K/D/A", "ACS", "ADR", "KAST", "FB-FD", "Impact"], out, numeric_from=2)


def versus_usual(evening, usual):
    """Each player's evening against his own average over the other matches."""
    out = []
    for name in sorted({r["name"] for r in evening}, key=lambda n: -sum(r["score"] for r in evening if r["name"] == n)):
        now, before = values([r for r in evening if r["name"] == name]), values([r for r in usual if r["name"] == name])
        row = [esc(name)]
        for key in ("acs", "adr", "kast", "impact"):
            v, b = mean(now, key), mean(before, key)
            if v is None or b is None:
                row += [fmt(key, v), "-"]
                continue
            d = v - b
            better = d > 0 if key != "dpr" else d < 0
            txt = f"{100 * d:+.0f} pts" if key == "kast" else f"{d:+.1f}" if key == "impact" else f"{d:+.0f}"
            # A gap that rounds to zero is shown as unchanged.
            same = txt.lstrip("+-").startswith(("0 ", "0.0")) or txt.lstrip("+-") == "0"
            row += [fmt(key, v), "=" if same else f'<td class="num {"v-good" if better else "v-bad"}">{txt}</td>']
        out.append(row)
    return table(["Joueur", "ACS", "vs habituel", "ADR", "vs habituel", "KAST", "vs habituel", "Impact", "vs habituel"], out)


def build(matches, squad, day=None):
    """Write the session report for the evening starting on `day` (YYYY-MM-DD), or the latest one."""
    all_sessions = sessions(matches, squad)
    if not all_sessions:
        raise SystemExit("No squad 5-stack in the data.")
    chosen = all_sessions[-1] if day is None else next((s for s in all_sessions if f"{started(s[0]):%Y-%m-%d}" == day), None)
    if chosen is None:
        raise SystemExit(f"No session starting on {day}. Known: {', '.join(f'{started(s[0]):%Y-%m-%d}' for s in all_sessions[-10:])}")
    rounds, deaths = extract(matches, squad)
    ids = {m["metadata"]["match_id"] for m in chosen}
    prof = history(rounds, deaths, ids)
    # Player facts over all matches so the impact uses the full win probability table.
    all_pr = [r for r in player_rounds(matches, squad)[0] if r["team"] == "squad"]
    evening = [r for r in all_pr if r["match"] in ids]
    usual = [r for r in all_pr if r["match"] not in ids]
    wp_table = win_prob_table(matches)
    day = f"{started(chosen[0]):%Y-%m-%d}"

    sections = []
    for m in chosen:
        sq_team = squad_team(m, squad)
        other = "Blue" if sq_team == "Red" else "Red"
        mid = m["metadata"]["match_id"]
        score = {t["team_id"]: t["rounds"]["won"] for t in m["teams"]}
        rs = [r for r in rounds if r["match"] == mid and r["team"] == "squad"]
        side_score = {s: (sum(r["won"] for r in rs if r["side"] == s), sum(r["side"] == s for r in rs)) for s in ("att", "def")}
        recurrent, unusual = map_findings(m, rounds, deaths, prof)
        sections.append({"map": m["metadata"]["map"]["name"], "us": score[sq_team], "them": score[other], "sides": side_score,
                         "scoreboard": scoreboard([r for r in evening if r["match"] == mid]),
                         "recurrent": recurrent, "unusual": unusual, "throws": costly_rounds(m, rounds, sq_team, wp_table)})

    # Evening summary: the bad points first, then the most costly throws.
    key_points = [(s["map"], pt) for s in sections for pt in s["recurrent"] + s["unusual"] if pt["tone"] == "bad"][:4]
    worst = sorted(((s["map"], c) for s in sections for c in s["throws"]), key=lambda x: -x[1]["best"])[:3]
    # Throw lines name what went wrong, not only the situation.
    summary = "".join(f'<li><strong>{esc(mp)}</strong> · {esc(pt["title"])} <span class="muted">({SIDE_CHIP[pt["side"]].lower()})</span></li>'
                      for mp, pt in key_points)
    summary += "".join(f'<li><strong>{esc(mp)}</strong> · R{c["round"]} : {esc(c["headline"].lower() if c["headline"][:1].islower() else c["headline"])} (throw en {esc(c["state"])})</li>' for mp, c in worst)

    chips = "".join(f'<span class="result {"win" if s["us"] > s["them"] else "loss" if s["us"] < s["them"] else ""}">'
                    f'{esc(s["map"])} {s["us"]}-{s["them"]}</span>' for s in sections)
    body = [f"<h1>Session du {day[8:10]}/{day[5:7]}/{day[:4]}</h1>", f'<div class="results">{chips}</div>',
            f'<div class="card summary"><h3>À retenir</h3><ul>{summary}</ul></div>',
            '<p class="small">Comparé à vos autres matchs sur chaque carte. Revenge : un coéquipier tue votre tueur dans les 3 secondes. '
            "Une seule soirée ne prouve rien : ce sont des rounds à revoir ensemble.</p>"]
    for s in sections:
        result = "Victoire" if s["us"] > s["them"] else "Défaite" if s["us"] < s["them"] else "Nul"
        sides = " · ".join(f"{SIDE_CHIP[k]} {w}/{n}" for k, (w, n) in s["sides"].items())
        body.append(f'<h2>{esc(s["map"])} <span class="{"good" if result == "Victoire" else "bad"}">{result} {s["us"]}-{s["them"]}</span></h2>'
                    f'<p class="muted">Rounds gagnés : {sides}</p>' + s["scoreboard"])
        body.append('<div class="cols">')
        for label, items in (("Erreurs qui reviennent", s["recurrent"]), ("Inhabituel ce soir", s["unusual"])):
            inner = f'<ul class="points">{"".join(point_html(pt) for pt in items)}</ul>' if items else '<p class="muted">Rien de particulier.</p>'
            body.append(f'<div class="col"><h3>{label}</h3>{inner}</div>')
        body.append("</div><h3>Rounds throw</h3>")
        body += [throw_html(c) for c in s["throws"]] or ['<p class="muted">Aucun round perdu en position favorable.</p>']
    body += ["<h2>Stats individuelles de la soirée</h2>", roster_table(evening, {}, {}),
             "<h3>Par rapport à leur niveau habituel</h3>", versus_usual(evening, usual)]
    month = OUT / f"period-{day[:7]}.html"
    if month.exists():
        body.append(f'<p><a href="{month.name}">Voir le rapport complet du mois</a></p>')
    body.append(MAP_LEGEND)
    OUT.mkdir(exist_ok=True)
    path = OUT / f"session-{day}.html"
    path.write_text(page(f"Session du {day[8:10]}/{day[5:7]}", "".join(body), CHART_CSS))
    return path
