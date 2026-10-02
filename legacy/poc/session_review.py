"""Session review: what went wrong tonight, read against the squad's long-term profile."""
import csv
import html
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

from analyze import CALLOUTS, DATA, ROOT, alive_after, attacker, buy_type, callout, extract as extract_facts

SIDE_FR = {"att": "attaque", "def": "défense"}
MIN_PROFILE_N = 8


def load_maps():
    return {m["displayName"]: m for m in json.load(open(DATA / "maps.json"))["data"] if m.get("callouts")}


MAPS = load_maps()


def to_minimap(map_name, loc, size):
    # valorant-api convention: game y drives image x, game x drives image y.
    m = MAPS[map_name]
    return ((loc["y"] * m["xMultiplier"] + m["xScalarToAdd"]) * size, (loc["x"] * m["yMultiplier"] + m["yScalarToAdd"]) * size)


def round_timelines(match):
    """Per round: ordered events with alive counts and plant state, from the attackers' point of view."""
    kills_by_round = defaultdict(list)
    for k in match["kills"]:
        kills_by_round[k["round"]].append(k)
    out = {}
    for r in match["rounds"]:
        att = attacker(r["id"])
        events = [("kill", k["time_in_round_in_ms"], k) for k in kills_by_round[r["id"]]]
        if r["plant"]:
            events.append(("plant", r["plant"]["round_time_in_ms"], r["plant"]))
        events.sort(key=lambda e: e[1])
        alive = {"Red": 5, "Blue": 5}
        planted = False
        states = [(None, 0, dict(alive), planted)]
        for kind, ms, e in events:
            if kind == "plant":
                planted = True
            else:
                alive = alive_after(e)
            states.append(((kind, e), ms, dict(alive), planted))
        out[r["id"]] = {"att": att, "winner": r["winning_team"], "states": states, "round": r}
    return out


def win_prob_table(matches):
    """Empirical P(team wins | own alive, opp alive, side, planted) over all matches, both teams."""
    counts = defaultdict(lambda: [0, 0])
    for m in matches:
        for tl in round_timelines(m).values():
            for _, _, alive, planted in tl["states"]:
                for team in ("Red", "Blue"):
                    other = "Blue" if team == "Red" else "Red"
                    key = (alive[team], alive[other], "att" if team == tl["att"] else "def", planted)
                    counts[key][0] += tl["winner"] == team
                    counts[key][1] += 1
    return counts


def wp(table, mine, theirs, side, planted):
    if mine == 0:
        return 0.0
    if theirs == 0:
        return 1.0
    won, n = table.get((mine, theirs, side, planted), (0, 0))
    return (won + 1) / (n + 2)


def svg_round(map_name, kill, squad_team, size=360):
    """Minimap with every player position at the given kill; the victim is drawn at the kill location."""
    m = MAPS[map_name]
    parts = [f'<svg viewBox="0 0 {size} {size}" width="{size}" height="{size}" class="map">',
             f'<image href="{m["displayIcon"]}" x="0" y="0" width="{size}" height="{size}" opacity="0.75"/>']
    pos = {p["player"]["puuid"]: (p["player"], p["location"]) for p in kill["player_locations"]}
    kx, ky = to_minimap(map_name, pos[kill["killer"]["puuid"]][1], size) if kill["killer"]["puuid"] in pos else (None, None)
    vx, vy = to_minimap(map_name, kill["location"], size)
    if kx is not None:
        parts.append(f'<line x1="{kx:.1f}" y1="{ky:.1f}" x2="{vx:.1f}" y2="{vy:.1f}" class="shot"/>')
    for puuid, (player, loc) in pos.items():
        x, y = to_minimap(map_name, loc, size)
        cls = "squad" if player["team"] == squad_team else "opp"
        parts.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="5" class="{cls}"/>')
        if player["team"] == squad_team:
            parts.append(f'<text x="{x + 7:.1f}" y="{y + 4:.1f}" class="label">{html.escape(player["name"])}</text>')
    cls = "squad" if kill["victim"]["team"] == squad_team else "opp"
    parts.append(f'<path d="M{vx - 5:.1f},{vy - 5:.1f}L{vx + 5:.1f},{vy + 5:.1f}M{vx - 5:.1f},{vy + 5:.1f}L{vx + 5:.1f},{vy - 5:.1f}" class="victim {cls}"/>')
    parts.append("</svg>")
    return "".join(parts)


def profile(facts, session_ids):
    """Long-term squad habits per map and side, excluding the session itself."""
    tr = [r for r in facts[0] if r["team"] == "squad" and r["match"] not in session_ids]
    deaths = [d for d in facts[1] if d["match"] not in session_ids and not d["teamkill"]]
    prof = defaultdict(dict)
    for (m, side) in {(r["map"], r["side"]) for r in tr}:
        rounds = [r for r in tr if r["map"] == m and r["side"] == side]
        n_matches = len({r["match"] for r in rounds})
        sq_deaths = [d for d in deaths if d["map"] == m and d["side"] == side and d["team"] == "squad"]
        openings = [d for d in deaths if d["map"] == m and d["opening"] and (d["team"] == "squad" and d["side"] == side or d["killer_team"] == "squad" and d["killer_side"] == side)]
        p = prof[(m, side)]
        p["matches"] = n_matches
        p["opening_won"] = (sum(d["killer_team"] == "squad" for d in openings), len(openings))
        p["traded"] = (sum(d["traded"] for d in sq_deaths), len(sq_deaths))
        planted = [r for r in rounds if r["planted"]]
        p["plant_rounds_won"] = (sum(r["won"] for r in planted), len(planted))
        p["adv_lost_per_match"] = sum(r["max_adv"] >= 2 and not r["won"] for r in rounds) / max(1, n_matches)
        spots = Counter((d["callout"], d["name"]) for d in sq_deaths if d["opening"])
        p["hotspots"] = {k: v for k, v in spots.items() if v >= 4}
        p["spot_totals"] = Counter(d["callout"] for d in sq_deaths if d["opening"])
    return prof


def pct(k, n):
    return f"{100 * k / n:.0f} %" if n else "-"


IN_SIDE = {"att": "en attaque", "def": "en défense"}
BUY_FR = {"pistol": "round pistol", "eco": "éco", "force": "achat partiel", "full": "achat complet"}


def join_fr(parts):
    parts = list(parts)
    return parts[0] if len(parts) == 1 else ", ".join(parts[:-1]) + " et " + parts[-1]


def rounds_fr(nums):
    nums = [str(n) for n in nums]
    return f"au round {nums[0]}" if len(nums) == 1 else f"aux rounds {join_fr(nums)}"


def avenged_fr(k, n):
    if n == 1:
        return "Elle a été vengée." if k else "Elle n'a pas été vengée."
    if k == 0:
        return "Aucune de ces morts n'a été vengée."
    return "Une seule de ces morts a été vengée." if k == 1 else f"{k} de ces {n} morts ont été vengées."


def differs(session, base, threshold=0.15, min_n=5):
    """Tonight differs clearly from the profile; no statistical claim on one session."""
    (k, n), (bk, bn) = session, base
    return n >= min_n and bn >= MIN_PROFILE_N and abs(k / n - bk / bn) >= threshold


NUM_FR = {2: "deux", 3: "trois", 4: "quatre", 5: "cinq"}


def de_fr(name):
    return f"d'{name}" if name[:1].lower() in "aeiouyh" else f"de {name}"


def times_fr(ts):
    ts = [round(t / 1000) for t in ts]
    return f"{ts[0]} s" if min(ts) == max(ts) else f"entre {min(ts)} et {max(ts)} s"


def story_fr(events, squad_team, map_name):
    """Readable sentences for a sequence of (kind, event, ms), grouping consecutive similar events."""
    groups = []
    for kind, e, t in events:
        if kind == "plant":
            key = ("plant", e["player"]["team"] == squad_team, e["site"])
        elif e["victim"]["team"] == squad_team:
            key = ("death", callout(map_name, e["location"]))
        else:
            key = ("kill", e["killer"]["name"], callout(map_name, e["location"]))
        if groups and groups[-1][0] == key and kind != "plant":
            groups[-1][1].append((e, t))
        else:
            groups.append((key, [(e, t)]))
    sentences = []
    for key, evs in groups:
        when = times_fr(t for _, t in evs)
        if key[0] == "plant":
            sentences.append(f"{'Vous posez' if key[1] else 'L’adversaire pose'} le spike sur {key[2]} ({when}).")
        elif key[0] == "death":
            names = join_fr(e["victim"]["name"] for e, _ in evs)
            sentences.append(f"{names} {'meurt' if len(evs) == 1 else 'meurent'} à {key[1]} ({when}).")
        else:
            what = "un adversaire" if len(evs) == 1 else f"{NUM_FR.get(len(evs), len(evs))} adversaires"
            sentences.append(f"{key[1]} élimine {what} à {key[2]} ({when}).")
    return " ".join(sentences)


def main(session_day="2026-09-30"):
    squad = {row[0]: row[1] for row in csv.reader(open(DATA / "squad.csv"))}
    dates = {row[0]: row[1] for row in csv.reader(open(DATA / "squad_matches.csv"))}
    session_ids = sorted((i for i, d in dates.items() if d.startswith(session_day)), key=lambda i: dates[i])
    matches = {p.stem: json.load(open(p)) for p in (DATA / "raw").glob("*.json")}
    table = win_prob_table(matches.values())
    facts = extract_facts(squad)
    prof = profile(facts, set(session_ids))
    tr_all, deaths_all, _ = facts

    sections = []
    summary = []
    for mid in session_ids:
        d = matches[mid]
        map_name = d["metadata"]["map"]["name"]
        team_of = {p["puuid"]: p["team_id"] for p in d["players"]}
        squad_team = Counter(t for p, t in team_of.items() if p in squad).most_common(1)[0][0]
        other = "Blue" if squad_team == "Red" else "Red"
        score = {t["team_id"]: t["rounds"]["won"] for t in d["teams"]}
        tr = [r for r in tr_all if r["match"] == mid and r["team"] == "squad"]
        deaths = [x for x in deaths_all if x["match"] == mid and not x["teamkill"]]
        result = "victoire" if score[squad_team] > score[other] else "défaite"
        title = f"{map_name} : {result} {score[squad_team]}-{score[other]}"
        summary.append(title)
        items = {"recurrent": [], "unusual": [], "costly": []}

        for side in ("att", "def"):
            p = prof.get((map_name, side))
            rounds = [r for r in tr if r["side"] == side]
            if not p or not rounds:
                continue
            hist = f"vos {p['matches']} derniers matchs sur {map_name}"
            sd = [x for x in deaths if x["team"] == "squad" and x["side"] == side]
            # Known weaknesses that showed up again tonight.
            for (spot, name), n_hist in sorted(p["hotspots"].items(), key=lambda kv: -kv[1]):
                tonight = [x for x in sd if x["opening"] and x["callout"] == spot and x["name"] == name]
                if tonight:
                    items["recurrent"].append(
                        f"{IN_SIDE[side].capitalize()}, {name} est mort le premier à {spot} {rounds_fr(x['round'] + 1 for x in tonight)}. "
                        f"{avenged_fr(sum(x['traded'] for x in tonight), len(tonight))} "
                        f"Ce n'est pas nouveau : ça lui est arrivé {n_hist} fois sur {hist}.")
            for spot, n_hist in p["spot_totals"].items():
                tonight = [x for x in sd if x["opening"] and x["callout"] == spot]
                if n_hist >= 5 and len(tonight) >= 2 and not any(spot == s_ for s_, _ in p["hotspots"]):
                    who = join_fr(f"{x['name']} au round {x['round'] + 1}" for x in tonight)
                    items["recurrent"].append(
                        f"{IN_SIDE[side].capitalize()}, vous êtes morts les premiers à {spot} {len(tonight)} fois : {who}. "
                        f"{avenged_fr(sum(x['traded'] for x in tonight), len(tonight))} "
                        f"Ce n'est pas nouveau : c'est arrivé {n_hist} fois sur {hist}.")
            # Tonight compared to the usual on this map and side.
            openings = [x for x in deaths if x["opening"] and (x["team"] == "squad" and x["side"] == side or x["killer_team"] == "squad" and x["killer_side"] == side)]
            s_open = (sum(x["killer_team"] == "squad" for x in openings), len(openings))
            if differs(s_open, p["opening_won"]):
                items["unusual"].append(
                    f"{IN_SIDE[side].capitalize()}, vous avez gagné le premier duel du round {s_open[0]} fois sur {s_open[1]}. "
                    f"D'habitude, vous le gagnez {pct(*p['opening_won'])} du temps sur {map_name}.")
            s_traded = (sum(x["traded"] for x in sd), len(sd))
            if differs(s_traded, p["traded"]):
                items["unusual"].append(
                    f"{IN_SIDE[side].capitalize()}, seulement {s_traded[0]} de vos {s_traded[1]} morts ont été vengées. "
                    f"D'habitude, c'est {pct(*p['traded'])} sur {map_name}.")
            planted = [r for r in rounds if r["planted"]]
            s_plant = (sum(r["won"] for r in planted), len(planted))
            if differs(s_plant, p["plant_rounds_won"]):
                if side == "def":
                    lead = f"En défense, l'adversaire a posé le spike dans {s_plant[1]} rounds et vous n'en avez gagné {'aucun' if s_plant[0] == 0 else 'qu’un seul'}." if s_plant[0] <= 1 else \
                        f"En défense, l'adversaire a posé le spike dans {s_plant[1]} rounds et vous en avez gagné {s_plant[0]}."
                else:
                    lead = f"En attaque, vous avez posé le spike dans {s_plant[1]} rounds et vous en avez gagné {s_plant[0]}."
                items["unusual"].append(f"{lead} D'habitude, vous gagnez {pct(*p['plant_rounds_won'])} de ces rounds sur {map_name}.")
            lost_adv = [r for r in rounds if r["max_adv"] >= 2 and not r["won"]]
            if len(lost_adv) >= max(2, round(p["adv_lost_per_match"] * 2)):
                usual = "moins d'une fois" if p["adv_lost_per_match"] < 1 else f"environ {p['adv_lost_per_match']:.0f} fois"
                items["unusual"].append(
                    f"{IN_SIDE[side].capitalize()}, vous avez perdu {len(lost_adv)} rounds alors que vous aviez au moins 2 joueurs de plus "
                    f"que l'adversaire ({rounds_fr(r['round'] + 1 for r in lost_adv)}). D'habitude, ça arrive {usual} par match.")

        # Costliest lost rounds: highest win probability the squad reached before losing.
        costly = []
        for idx, tl in round_timelines(d).items():
            if tl["winner"] == squad_team:
                continue
            side = "att" if tl["att"] == squad_team else "def"
            best, best_i, worst_drop, drop_event = 0, 0, 0, None
            prev = None
            for i, (ev, ms, alive, planted) in enumerate(tl["states"]):
                w = wp(table, alive[squad_team], alive[other], side, planted)
                if w > best:
                    best, best_i = w, i
                if prev is not None and ev and ev[0] == "kill" and prev - w > worst_drop:
                    worst_drop, drop_event = prev - w, ev[1]
                prev = w
            costly.append((best, idx, side, best_i, drop_event, tl))
        costly.sort(key=lambda c: -c[0])
        for best, idx, side, best_i, kill, tl in costly[:3]:
            if best < 0.5:
                continue
            r_tr = next(r for r in tr if r["round"] == idx)
            _, ms, alive, planted = tl["states"][best_i]
            if r_tr["buy"] == "pistol":
                buy = "Round pistol"
            elif r_tr["buy"] == r_tr["opp_buy"]:
                buy = f"Les deux équipes en {BUY_FR[r_tr['buy']]}"
            else:
                buy = f"Vous en {BUY_FR[r_tr['buy']]}, l'adversaire en {BUY_FR[r_tr['opp_buy']]}"
            head = f"Round {idx + 1}, {IN_SIDE[side]}. {buy}."
            when = "En début de round" if ms == 0 else f"À {ms / 1000:.0f} s"
            odds = "le round était presque gagné" if best >= 0.95 else f"vous aviez environ {round(10 * best)} chances sur 10 de le gagner"
            situation = f"{when}, vous étiez {alive[squad_team]} contre {alive[other]}{', spike posé' if planted else ''} : {odds}."
            after = story_fr([(ev[0], ev[1], t) for ev, t, _, _ in tl["states"][best_i + 1:]], squad_team, map_name)
            story = f"{after} Round perdu."
            turning = ""
            if kill:
                turning = (f"Le round bascule à la mort {de_fr(kill['victim']['name'])} à {callout(map_name, kill['location'])} "
                           f"({kill['time_in_round_in_ms'] / 1000:.0f} s) : c'est ce moment que montre la carte.")
            items["costly"].append((head, situation + " " + story, turning, svg_round(map_name, kill, squad_team) if kill else ""))
        sections.append((title, items))

    write_html(session_day, summary, sections)
    for title, items in sections:
        print(f"\n## {title}")
        for k in ("recurrent", "unusual"):
            for line in items[k]:
                print(f"- [{k}] {line}")
        for head, story, turning, _ in items["costly"]:
            print(f"- [costly] {head}\n    {story}\n    {turning}")


def write_html(day, summary, sections):
    css = """
:root{--bg:#f7f7f5;--fg:#1d1d1b;--muted:#6b6b66;--card:#fff;--line:#e3e3de;--squad:#1f8a70;--opp:#d1495b;--accent:#3a5a8c}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#141413;--fg:#ecece8;--muted:#a3a39c;--card:#1e1e1c;--line:#33332f;--squad:#4cc39f;--opp:#ef6f7f;--accent:#8fb0e6}}
:root[data-theme="dark"]{--bg:#141413;--fg:#ecece8;--muted:#a3a39c;--card:#1e1e1c;--line:#33332f;--squad:#4cc39f;--opp:#ef6f7f;--accent:#8fb0e6}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,sans-serif}
main{max-width:980px;margin:0 auto;padding:24px 16px}
h1{font-size:24px;margin:0 0 4px}h2{font-size:20px;margin:32px 0 8px;border-bottom:1px solid var(--line);padding-bottom:4px}
h3{font-size:15px;margin:16px 0 6px;color:var(--accent)}.muted{color:var(--muted)}
ul{padding-left:18px;margin:4px 0}.round{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:12px;margin:10px 0;display:flex;gap:14px;flex-wrap:wrap}
.round .txt{flex:1 1 300px;min-width:0}.seq{font-size:13px;color:var(--muted);overflow-wrap:anywhere}
.map{max-width:100%;height:auto;background:#0b0b0b;border-radius:6px}.shot{stroke:#f2c14e;stroke-width:2}
circle.squad{fill:var(--squad);stroke:#fff;stroke-width:1}circle.opp{fill:var(--opp);stroke:#fff;stroke-width:1}
.victim{stroke-width:3}.victim.squad{stroke:var(--squad)}.victim.opp{stroke:var(--opp)}
.label{font-size:10px;fill:#fff;paint-order:stroke;stroke:#000;stroke-width:2px}
"""
    labels = {"recurrent": "Erreurs qui reviennent souvent", "unusual": "Inhabituel ce soir", "costly": "Rounds que vous auriez dû gagner"}
    out = [f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
           f"<title>Review de session</title><style>{css}</style></head><body><main>",
           f"<h1>Review de session du {day[8:10]}/{day[5:7]}</h1>",
           f'<p>{" · ".join(html.escape(s) for s in summary)}</p>',
           "<p>Pour chaque carte, trois rubriques : les erreurs que vous faites souvent et qui sont revenues ce soir, "
           "ce qui a été inhabituel par rapport à vos matchs précédents sur la même carte, et les rounds que vous étiez "
           "bien partis pour gagner mais que vous avez perdus.</p>",
           '<p class="muted">Une mort est « vengée » quand un coéquipier tue le tueur dans les 3 secondes. Les chances de gagner '
           "viennent de vos 102 matchs : par exemple, une équipe à 3 contre 2 en défense gagne environ 7 rounds sur 10. "
           "Une seule soirée ne prouve rien : ce sont des rounds à revoir ensemble.</p>",
           '<p class="muted">Sur les cartes : vos joueurs en <span style="color:var(--squad)">vert</span>, les adversaires en '
           '<span style="color:var(--opp)">rouge</span>. La croix marque le joueur tué, le trait jaune relie le tueur à sa victime.</p>']
    for title, items in sections:
        out.append(f"<h2>{html.escape(title)}</h2>")
        for key in ("recurrent", "unusual"):
            out.append(f"<h3>{labels[key]}</h3>")
            out.append("<ul>" + "".join(f"<li>{html.escape(l)}</li>" for l in items[key]) + "</ul>" if items[key] else '<p class="muted">Rien de particulier.</p>')
        out.append(f"<h3>{labels['costly']}</h3>")
        for head, story, turning, svg in items["costly"]:
            out.append(f'<div class="round"><div class="txt"><p><strong>{html.escape(head)}</strong></p><p>{html.escape(story)}</p>'
                       f'<p class="seq">{html.escape(turning)}</p></div>{svg}</div>')
    out.append("</main></body></html>")
    (ROOT / "session_review.html").write_text("\n".join(out))


if __name__ == "__main__":
    main(*sys.argv[1:])
