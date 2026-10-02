"""Extract round facts from squad 5-stacks and report squad patterns that differ from same-elo opponents."""
import csv
import glob
import json
import math
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).parent
DATA = ROOT / "data"
TRADE_WINDOW_MS = 3000
FULL_BUY = 3700
ECO = 2000
MIN_N = 15
FDR_Q = 0.10


def load_callouts():
    out = {}
    for m in json.load(open(DATA / "maps.json"))["data"]:
        if m.get("callouts"):
            out[m["displayName"]] = [(c["location"]["x"], c["location"]["y"], f'{c["superRegionName"]} {c["regionName"]}') for c in m["callouts"]]
    return out


CALLOUTS = load_callouts()


def callout(map_name, loc):
    best = min(CALLOUTS[map_name], key=lambda c: (c[0] - loc["x"]) ** 2 + (c[1] - loc["y"]) ** 2)
    return best[2]


def alive_after(kill):
    alive = Counter(p["player"]["team"] for p in kill["player_locations"])
    return {"Red": alive["Red"], "Blue": alive["Blue"]}


def attacker(round_idx):
    # Red attacks first half, sides swap at 12, then every round in overtime (checked on plants).
    if round_idx < 12:
        return "Red"
    if round_idx < 24:
        return "Blue"
    return "Red" if (round_idx - 24) % 2 == 0 else "Blue"


def buy_type(round_idx, loadouts):
    if round_idx in (0, 12):
        return "pistol"
    avg = sum(loadouts) / len(loadouts)
    return "full" if avg >= FULL_BUY else "eco" if avg < ECO else "force"


def extract(squad):
    """Return team-round rows, death rows and first-kill position rows, labelled squad/opp."""
    team_rounds, deaths, positions = [], [], []
    for path in sorted(glob.glob(str(DATA / "raw" / "*.json"))):
        d = json.load(open(path))
        map_name = d["metadata"]["map"]["name"]
        if map_name not in CALLOUTS:
            continue
        team_of = {p["puuid"]: p["team_id"] for p in d["players"]}
        counts = Counter(t for p, t in team_of.items() if p in squad)
        squad_team = next((t for t, n in counts.items() if n >= 5), None)
        if not squad_team:
            continue
        label = lambda team: "squad" if team == squad_team else "opp"
        mid = d["metadata"]["match_id"]
        kills_by_round = defaultdict(list)
        for k in d["kills"]:
            kills_by_round[k["round"]].append(k)

        for r in d["rounds"]:
            idx = r["id"]
            att = attacker(idx)
            kills = sorted(kills_by_round[idx], key=lambda k: k["time_in_round_in_ms"])
            plant_ms = r["plant"]["round_time_in_ms"] if r["plant"] else None
            damage = {s["player"]["puuid"]: sum(e["damage"] for e in s["damage_events"]) for s in r["stats"]}
            alive = {"Red": 5, "Blue": 5}
            max_adv = {"Red": 0, "Blue": 0}
            clutch = {}
            alive_at_plant = None

            for i, k in enumerate(kills):
                vt, kt = k["victim"]["team"], k["killer"]["team"]
                if plant_ms is not None and alive_at_plant is None and k["time_in_round_in_ms"] > plant_ms:
                    alive_at_plant = dict(alive)
                traded = any(
                    k2["victim"]["puuid"] == k["killer"]["puuid"] and k2["killer"]["team"] == vt
                    and 0 <= k2["time_in_round_in_ms"] - k["time_in_round_in_ms"] <= TRADE_WINDOW_MS
                    for k2 in kills[i + 1:]
                )
                deaths.append({
                    "match": mid, "map": map_name, "round": idx, "team": label(vt), "puuid": k["victim"]["puuid"],
                    "name": k["victim"]["name"], "side": "att" if vt == att else "def",
                    "ms": k["time_in_round_in_ms"], "opening": i == 0, "traded": traded,
                    "callout": callout(map_name, k["location"]), "damage": damage.get(k["victim"]["puuid"], 0),
                    "post_plant": plant_ms is not None and k["time_in_round_in_ms"] > plant_ms,
                    "killer_team": label(kt), "killer": k["killer"]["name"], "killer_side": "att" if kt == att else "def", "won": r["winning_team"] == vt, "teamkill": vt == kt,
                })
                # The kill snapshot lists exactly the players alive after it, revives included.
                alive = alive_after(k)
                for t, o in (("Red", "Blue"), ("Blue", "Red")):
                    max_adv[t] = max(max_adv[t], alive[t] - alive[o])
                    if alive[t] == 1 and alive[o] >= 1 and t not in clutch:
                        clutch[t] = alive[o]
                if i == 0:
                    for p in k["player_locations"]:
                        pt = p["player"]["team"]
                        positions.append({
                            "map": map_name, "team": label(pt), "puuid": p["player"]["puuid"], "name": p["player"]["name"],
                            "side": "att" if pt == att else "def", "callout": callout(map_name, p["location"]),
                            "ms": k["time_in_round_in_ms"],
                        })
            if plant_ms is not None and alive_at_plant is None:
                alive_at_plant = dict(alive)

            first_team = kills[0]["killer"]["team"] if kills else None
            for team in ("Red", "Blue"):
                other = "Blue" if team == "Red" else "Red"
                loadouts = [s["economy"]["loadout_value"] for s in r["stats"] if s["player"]["team"] == team]
                if len(loadouts) < 5:
                    continue
                opp_loadouts = [s["economy"]["loadout_value"] for s in r["stats"] if s["player"]["team"] == other]
                team_rounds.append({
                    "match": mid, "map": map_name, "round": idx, "team": label(team), "side": "att" if team == att else "def",
                    "won": r["winning_team"] == team, "first_kill": first_team == team if first_team else None,
                    "buy": buy_type(idx, loadouts), "opp_buy": buy_type(idx, opp_loadouts),
                    "desync": idx not in (0, 12) and sum(v >= FULL_BUY for v in loadouts) >= 2 and sum(v < ECO for v in loadouts) >= 2,
                    "max_adv": max_adv[team], "clutch_vs": clutch.get(team),
                    "planted": plant_ms is not None, "adv_at_plant": None if alive_at_plant is None else alive_at_plant[team] - alive_at_plant[other],
                })
    return team_rounds, deaths, positions


def z_test(k1, n1, k2, n2):
    p = (k1 + k2) / (n1 + n2)
    se = math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2)) if 0 < p < 1 else 0
    if se == 0:
        return 1.0
    z = (k1 / n1 - k2 / n2) / se
    return math.erfc(abs(z) / math.sqrt(2))


def benjamini_hochberg(tests):
    tests.sort(key=lambda t: t["p"])
    m = len(tests)
    cutoff = 0
    for i, t in enumerate(tests, 1):
        if t["p"] <= FDR_Q * i / m:
            cutoff = i
    return tests[:cutoff]


def rate(rows, pred):
    rows = list(rows)
    return sum(1 for r in rows if pred(r)), len(rows)


def candidate_tests(team_rounds, deaths, squad_names):
    """Compare squad rates to opponent rates on the same matches, globally and per map/side/player."""
    tests = []

    def add(desc, sq_rows, op_rows, pred):
        k1, n1 = rate(sq_rows, pred)
        k2, n2 = rate(op_rows, pred)
        if n1 >= MIN_N and n2 >= MIN_N:
            tests.append({"desc": desc, "sq": (k1, n1), "op": (k2, n2), "p": z_test(k1, n1, k2, n2)})

    sq_tr = [r for r in team_rounds if r["team"] == "squad"]
    op_tr = [r for r in team_rounds if r["team"] == "opp"]
    maps = sorted({r["map"] for r in team_rounds})
    scopes = [("global", lambda r: True)]
    scopes += [(f"{s}", (lambda s: lambda r: r["side"] == s)(s)) for s in ("att", "def")]
    scopes += [(f"{m} {s}", (lambda m, s: lambda r: r["map"] == m and r["side"] == s)(m, s)) for m in maps for s in ("att", "def")]

    for scope, f in scopes:
        sq = [r for r in sq_tr if f(r)]
        op = [r for r in op_tr if f(r)]
        add(f"[{scope}] round gagné", sq, op, lambda r: r["won"])
        add(f"[{scope}] premier kill obtenu", [r for r in sq if r["first_kill"] is not None], [r for r in op if r["first_kill"] is not None], lambda r: r["first_kill"])
        add(f"[{scope}] round gagné après premier kill (5v4)", [r for r in sq if r["first_kill"]], [r for r in op if r["first_kill"]], lambda r: r["won"])
        add(f"[{scope}] round gagné après première mort (4v5)", [r for r in sq if r["first_kill"] is False], [r for r in op if r["first_kill"] is False], lambda r: r["won"])
        add(f"[{scope}] round perdu après avantage de 2+", [r for r in sq if r["max_adv"] >= 2], [r for r in op if r["max_adv"] >= 2], lambda r: not r["won"])
        add(f"[{scope}] round gagné avec plant (attaque)", [r for r in sq if r["planted"] and r["side"] == "att"], [r for r in op if r["planted"] and r["side"] == "att"], lambda r: r["won"])
        add(f"[{scope}] retake réussi (défense)", [r for r in sq if r["planted"] and r["side"] == "def"], [r for r in op if r["planted"] and r["side"] == "def"], lambda r: r["won"])

    for b in ("eco", "force", "full"):
        add(f"[éco] round gagné en {b} contre full", [r for r in sq_tr if r["buy"] == b and r["opp_buy"] == "full"], [r for r in op_tr if r["buy"] == b and r["opp_buy"] == "full"], lambda r: r["won"])
    add("[éco] achat désynchronisé (2+ full et 2+ éco)", [r for r in sq_tr if r["buy"] != "pistol"], [r for r in op_tr if r["buy"] != "pistol"], lambda r: r["desync"])
    add("[éco] round 2 en force/full après pistol perdu", [r for r in sq_tr if r["round"] in (1, 13)], [r for r in op_tr if r["round"] in (1, 13)], lambda r: r["buy"] in ("force", "full"))

    sq_d = [d for d in deaths if d["team"] == "squad" and not d["teamkill"]]
    op_d = [d for d in deaths if d["team"] == "opp" and not d["teamkill"]]
    for scope, f in [("global", lambda d: True)] + [(s, (lambda s: lambda d: d["side"] == s)(s)) for s in ("att", "def")]:
        sq = [d for d in sq_d if f(d)]
        op = [d for d in op_d if f(d)]
        add(f"[{scope}] mort échangée (trade < 3 s)", sq, op, lambda d: d["traded"])
        add(f"[{scope}] mort sans avoir infligé de dégâts", sq, op, lambda d: d["damage"] == 0)
        add(f"[{scope}] mort avant 25 s", sq, op, lambda d: d["ms"] < 25000)
        for name in squad_names:
            add(f"[{scope}] {name} : mort échangée", [d for d in sq if d["name"] == name], op, lambda d: d["traded"])
            add(f"[{scope}] {name} : mort sans dégâts infligés", [d for d in sq if d["name"] == name], op, lambda d: d["damage"] == 0)
            add(f"[{scope}] {name} : mort ouvrant le round (part des morts)", [d for d in sq if d["name"] == name], op, lambda d: d["opening"])
            add(f"[{scope}] {name} : mort avant 25 s", [d for d in sq if d["name"] == name], op, lambda d: d["ms"] < 25000)
    def add_half(desc, rows, pred):
        k, n = rate(rows, pred)
        if n >= MIN_N:
            tests.append({"desc": desc, "sq": (k, n), "op": None, "p": math.erfc(abs(k / n - 0.5) / math.sqrt(0.25 / n) / math.sqrt(2))})

    # A duel is a kill between the two teams; the squad's share of won duels is compared to 50 %.
    duels = [d for d in deaths if not d["teamkill"]]
    squad_side = lambda d: d["killer_side"] if d["killer_team"] == "squad" else d["side"]
    for scope, f in [("global", lambda d: True)] + [(s, (lambda s: lambda d: squad_side(d) == s)(s)) for s in ("att", "def")]:
        sq = [d for d in duels if f(d)]
        add_half(f"[{scope}] duels avant 25 s gagnés par l'escouade", [d for d in sq if d["ms"] < 25000], lambda d: d["killer_team"] == "squad")
        add_half(f"[{scope}] duels d'ouverture gagnés par l'escouade", [d for d in sq if d["opening"]], lambda d: d["killer_team"] == "squad")
        for name in squad_names:
            add_half(f"[{scope}] {name} : duels d'ouverture gagnés", [d for d in sq if d["opening"] and name in (d["name"], d["killer"])], lambda d: d["killer"] == name)
    return tests


def fmt_test(t):
    (k1, n1) = t["sq"]
    if t["op"] is None:
        return f"- {t['desc']} : {k1}/{n1} = {100 * k1 / n1:.0f} % (référence 50 %), p = {t['p']:.4f}"
    k2, n2 = t["op"]
    return f"- {t['desc']} : escouade {k1}/{n1} = {100 * k1 / n1:.0f} %, adversaires {100 * k2 / n2:.0f} % (n = {n2}), p = {t['p']:.4f}"


def predictability(positions, deaths, squad_names):
    """Per squad player, map and side: most frequent callout at first kill and opening death rate there."""
    lines = []
    groups = defaultdict(list)
    for p in positions:
        if p["team"] == "squad" and p["name"] in squad_names:
            groups[(p["name"], p["map"], p["side"])].append(p)
    for (name, m, side), rows in sorted(groups.items()):
        if len(rows) < 12:
            continue
        top, n_top = Counter(r["callout"] for r in rows).most_common(1)[0]
        lines.append((n_top / len(rows), f"- {name}, {m} {side} : {top} dans {n_top}/{len(rows)} rounds ({100 * n_top / len(rows):.0f} %)"))
    return [l for _, l in sorted(lines, reverse=True)]


def opening_spots(deaths):
    """Callouts where squad opening deaths concentrate, per map and side."""
    lines = []
    groups = defaultdict(list)
    for d in deaths:
        if d["team"] == "squad" and d["opening"]:
            groups[(d["map"], d["side"])].append(d)
    for (m, side), rows in sorted(groups.items()):
        if len(rows) < 12:
            continue
        top = Counter((r["callout"]) for r in rows).most_common(2)
        who = Counter(r["name"] for r in rows if r["callout"] == top[0][0]).most_common(1)[0]
        traded = sum(r["traded"] for r in rows if r["callout"] == top[0][0])
        lines.append(f"- {m} {side} : {len(rows)} premières morts, dont {top[0][1]} à {top[0][0]} ({who[0]} x{who[1]}, échangées {traded}/{top[0][1]})"
                     + (f", puis {top[1][1]} à {top[1][0]}" if len(top) > 1 else ""))
    return lines


def main():
    squad = {row[0]: row[1] for row in csv.reader(open(DATA / "squad.csv"))}
    team_rounds, deaths, positions = extract(squad)
    squad_names = sorted(set(squad.values()))
    n_matches = len({r["match"] for r in team_rounds})
    n_rounds = sum(1 for r in team_rounds if r["team"] == "squad")
    tests = candidate_tests(team_rounds, deaths, squad_names)
    kept = benjamini_hochberg(list(tests))

    out = [f"# POC : motifs de l'escouade\n", f"{n_matches} matchs 5-stack, {n_rounds} rounds. Référence : les adversaires des mêmes matchs (même elo).\n",
           f"## Écarts significatifs ({len(kept)} sur {len(tests)} comparaisons, FDR {FDR_Q})\n"]
    out += [fmt_test(t) for t in sorted(kept, key=lambda t: t["desc"])] or ["- aucun"]
    out += ["\n## Comparaisons proches du seuil (p < 0.05, non retenues)\n"]
    out += [fmt_test(t) for t in tests if t["p"] < 0.05 and t not in kept]
    out += ["\n## Prévisibilité : position au premier kill du round\n"] + predictability(positions, deaths, squad_names)[:25]
    out += ["\n## Où l'escouade meurt en premier\n"] + opening_spots(deaths)
    (ROOT / "report.md").write_text("\n".join(out) + "\n")
    json.dump({"team_rounds": team_rounds, "deaths": deaths, "positions": positions}, open(DATA / "facts.json", "w"))
    print("\n".join(out))


if __name__ == "__main__":
    main()
