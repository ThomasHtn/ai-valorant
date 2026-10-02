"""Team strategy patterns of the squad (site choice, tempo, defense setups, retakes, post-pistol economy)."""
import csv
import glob
import json
from collections import Counter, defaultdict
from pathlib import Path

from analyze import DATA, ROOT, CALLOUTS, alive_after, attacker, benjamini_hochberg, buy_type, callout, z_test

MIN_N = 10
SITES = ("A", "B", "C", "Mid")


def zone(map_name, loc):
    first = callout(map_name, loc).split(" ")[0]
    return first if first in SITES else "autre"


def tempo(ms):
    return "rapide (<40 s)" if ms < 40000 else "moyen (40-70 s)" if ms < 70000 else "tardif (>70 s)"


def extract(squad, dates):
    rows = []
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
        mid = d["metadata"]["match_id"]
        kills_by_round = defaultdict(list)
        for k in d["kills"]:
            kills_by_round[k["round"]].append(k)
        pistol_winner = {r["id"]: r["winning_team"] for r in d["rounds"] if r["id"] in (0, 12)}
        won_by = {r["id"]: r["winning_team"] for r in d["rounds"]}

        for r in d["rounds"]:
            idx = r["id"]
            att = attacker(idx)
            dfn = "Blue" if att == "Red" else "Red"
            kills = sorted(kills_by_round[idx], key=lambda k: k["time_in_round_in_ms"])
            plant = r["plant"]
            alive = {"Red": 5, "Blue": 5}
            alive_at_plant = None
            for k in kills:
                if plant and alive_at_plant is None and k["time_in_round_in_ms"] > plant["round_time_in_ms"]:
                    alive_at_plant = dict(alive)
                alive = alive_after(k)
            if plant and alive_at_plant is None:
                alive_at_plant = dict(alive)

            # Defender positions at the first kill (median ~12 s), victim included at the kill location.
            def_zones, first_ms = Counter(), None
            if kills:
                k = kills[0]
                first_ms = k["time_in_round_in_ms"]
                snap = [(p["player"]["team"], p["location"]) for p in k["player_locations"]] + [(k["victim"]["team"], k["location"])]
                for team, loc in snap:
                    if team == dfn:
                        def_zones[zone(map_name, loc)] += 1

            loadouts = lambda t: [s["economy"]["loadout_value"] for s in r["stats"] if s["player"]["team"] == t]
            for team in ("Red", "Blue"):
                if len(loadouts(team)) < 5:
                    continue
                side = "att" if team == att else "def"
                other = dfn if team == att else att
                half_start = 0 if idx < 12 else 12
                lost_pistol = idx in (1, 2, 13, 14) and pistol_winner.get(half_start) not in (None, team)
                rows.append({
                    "match": mid, "date": dates.get(mid, "")[:16], "map": map_name, "round": idx + 1,
                    "team": "squad" if team == squad_team else "opp", "side": side, "won": r["winning_team"] == team,
                    "buy": buy_type(idx, loadouts(team)), "opp_buy": buy_type(idx, loadouts(other)),
                    "plant_site": plant["site"] if plant else None, "plant_ms": plant["round_time_in_ms"] if plant else None,
                    "adv_at_plant": None if alive_at_plant is None else alive_at_plant[team] - alive_at_plant[other],
                    "first_ms": first_ms, "first_kill": kills[0]["killer"]["team"] == team if kills else None,
                    "setup": " ".join(f"{s}{def_zones[s]}" for s in SITES if def_zones[s]) if def_zones else None,
                    "stack": next((s for s in SITES if def_zones[s] >= 3), None),
                    "lost_pistol": lost_pistol,
                    "prev_won": idx > 0 and won_by.get(idx - 1) == team,
                })
    return rows


def pct(k, n):
    return f"{k}/{n} ({100 * k / n:.0f} %)" if n else "0/0"


def table(title, groups, base=None):
    """groups: {label: rows}; base: {label: opp rows} for the same label."""
    lines = [f"\n### {title}\n", "| | rounds | gagnés | adversaires |", "|---|---|---|---|"]
    for label, rows in sorted(groups.items(), key=lambda kv: -len(kv[1])):
        k = sum(r["won"] for r in rows)
        b = base.get(label, []) if base else []
        lines.append(f"| {label} | {len(rows)} | {pct(k, len(rows))} | {pct(sum(r['won'] for r in b), len(b)) if b else '-'} |")
    return lines


def group(rows, key):
    out = defaultdict(list)
    for r in rows:
        v = key(r)
        if v is not None:
            out[v].append(r)
    return out


def rounds_ref(rows, limit=12):
    refs = [f"{r['date']} R{r['round']}" for r in sorted(rows, key=lambda r: (r["date"], r["round"]), reverse=True)]
    return ", ".join(refs[:limit]) + (f" (+{len(refs) - limit})" if len(refs) > limit else "")


def main():
    squad = {row[0]: row[1] for row in csv.reader(open(DATA / "squad.csv"))}
    dates = {row[0]: row[1] for row in csv.reader(open(DATA / "squad_matches.csv"))}
    rows = extract(squad, dates)
    sq = [r for r in rows if r["team"] == "squad"]
    op = [r for r in rows if r["team"] == "opp"]
    maps = [m for m, _ in Counter(r["map"] for r in sq).most_common()]
    tests = []

    def test(desc, s_rows, o_rows, pred, refs):
        k1, n1 = sum(pred(r) for r in s_rows), len(s_rows)
        k2, n2 = sum(pred(r) for r in o_rows), len(o_rows)
        if n1 >= MIN_N and n2 >= MIN_N:
            tests.append({"desc": desc, "sq": (k1, n1), "op": (k2, n2), "p": z_test(k1, n1, k2, n2), "refs": refs})

    out = ["# POC : stratégie de l'escouade\n",
           f"{len({r['match'] for r in sq})} matchs, {len(sq)} rounds. Référence : adversaires des mêmes matchs, sur la même carte et le même side.\n"]
    body = []
    for m in maps:
        s_att = [r for r in sq if r["map"] == m and r["side"] == "att" and r["buy"] != "eco"]
        o_att = [r for r in op if r["map"] == m and r["side"] == "att" and r["buy"] != "eco"]
        s_def = [r for r in sq if r["map"] == m and r["side"] == "def"]
        o_def = [r for r in op if r["map"] == m and r["side"] == "def"]
        n_matches = len({r["match"] for r in s_def})
        body.append(f"\n## {m} ({n_matches} matchs)")

        site = lambda r: r["plant_site"] or "pas de plant"
        body += table("Attaque (hors éco) : site du plant", group(s_att, site), group(o_att, site))
        body += table("Attaque (hors éco) : tempo du plant", group([r for r in s_att if r["plant_ms"]], lambda r: tempo(r["plant_ms"])),
                      group([r for r in o_att if r["plant_ms"]], lambda r: tempo(r["plant_ms"])))
        stack = lambda r: f"stack {r['stack']}" if r["stack"] else "sans stack"
        body += table("Défense : stack au premier kill", group(s_def, stack), group(o_def, stack))
        setups = group(s_def, lambda r: r["setup"])
        body += table("Défense : setups les plus joués au premier kill", {k: v for k, v in setups.items() if len(v) >= 5})
        body += table("Défense : site planté par l'adversaire (retake)", group(s_def, lambda r: r["plant_site"]), group(o_def, lambda r: r["plant_site"]))
        adv = lambda r: None if r["adv_at_plant"] is None else "supériorité" if r["adv_at_plant"] > 0 else "égalité" if r["adv_at_plant"] == 0 else "infériorité"
        body += table("Défense : retake selon les joueurs en vie au plant", group(s_def, adv), group(o_def, adv))

        test(f"{m} attaque : rounds sans plant (hors éco)", s_att, o_att, lambda r: r["plant_site"] is None, [r for r in s_att if r["plant_site"] is None and not r["won"]])
        for s in ("A", "B", "C"):
            sp = [r for r in s_att if r["plant_site"] == s]
            test(f"{m} attaque : part des plants sur {s}", [r for r in s_att if r["plant_site"]], [r for r in o_att if r["plant_site"]], lambda r: r["plant_site"] == s, [])
            rs = [r for r in s_def if r["plant_site"] == s]
            test(f"{m} défense : retake gagné sur {s}", rs, [r for r in o_def if r["plant_site"] == s], lambda r: r["won"], [r for r in rs if not r["won"]])
            test(f"{m} défense : site {s} pris par l'adversaire", [r for r in s_def if r["plant_site"]], [r for r in o_def if r["plant_site"]], lambda r: r["plant_site"] == s, [])
        sup = [r for r in s_def if (r["adv_at_plant"] or 0) > 0]
        test(f"{m} défense : retake gagné en supériorité", sup, [r for r in o_def if (r["adv_at_plant"] or 0) > 0], lambda r: r["won"], [r for r in sup if not r["won"]])
        test(f"{m} défense : round gagné avec un stack", [r for r in s_def if r["stack"]], [r for r in o_def if r["stack"]], lambda r: r["won"], [r for r in s_def if r["stack"] and not r["won"]])
        test(f"{m} défense : stack joué", s_def, o_def, lambda r: r["stack"] is not None, [])

    # Pooled over maps: fewer tests, more rounds per test.
    s_att = [r for r in sq if r["side"] == "att" and r["buy"] != "eco"]
    o_att = [r for r in op if r["side"] == "att" and r["buy"] != "eco"]
    s_def = [r for r in sq if r["side"] == "def"]
    o_def = [r for r in op if r["side"] == "def"]
    test("Toutes cartes, attaque : rounds sans plant (hors éco)", s_att, o_att, lambda r: r["plant_site"] is None, [])
    test("Toutes cartes, attaque : plant tardif (>70 s)", [r for r in s_att if r["plant_ms"]], [r for r in o_att if r["plant_ms"]], lambda r: r["plant_ms"] >= 70000, [])
    test("Toutes cartes, défense : retake gagné", [r for r in s_def if r["plant_site"]], [r for r in o_def if r["plant_site"]], lambda r: r["won"], [])
    for label, f in (("supériorité", lambda r: (r["adv_at_plant"] or 0) > 0), ("égalité", lambda r: r["adv_at_plant"] == 0), ("infériorité", lambda r: (r["adv_at_plant"] or 0) < 0)):
        test(f"Toutes cartes, défense : retake gagné en {label}", [r for r in s_def if r["plant_site"] and f(r)], [r for r in o_def if r["plant_site"] and f(r)], lambda r: r["won"], [])
        test(f"Toutes cartes, attaque : post-plant gagné en {label}", [r for r in s_att if r["plant_site"] and f(r)], [r for r in o_att if r["plant_site"] and f(r)], lambda r: r["won"], [])
    test("Toutes cartes, défense : stack joué", s_def, o_def, lambda r: r["stack"] is not None, [])
    test("Toutes cartes, défense : round gagné avec un stack", [r for r in s_def if r["stack"]], [r for r in o_def if r["stack"]], lambda r: r["won"], [])
    test("Toutes cartes, défense : round gagné sans stack", [r for r in s_def if not r["stack"]], [r for r in o_def if not r["stack"]], lambda r: r["won"], [])

    # Economy after a lost pistol, both halves pooled over all maps.
    eco = ["\n## Économie après un pistol perdu (toutes cartes)\n", "| Achat au round 2 | escouade : round 2 gagné | escouade : round 3 gagné | adversaires : round 2 | adversaires : round 3 |", "|---|---|---|---|---|"]
    for b in ("eco", "force", "full"):
        cells = []
        for team_rows in (sq, op):
            r2 = [r for r in team_rows if r["round"] in (2, 14) and r["lost_pistol"] and r["buy"] == b]
            nxt = {(r["match"], r["round"]): r for r in team_rows if r["round"] in (3, 15)}
            r3 = [nxt[(r["match"], r["round"] + 1)] for r in r2 if (r["match"], r["round"] + 1) in nxt]
            cells += [pct(sum(r["won"] for r in r2), len(r2)), pct(sum(r["won"] for r in r3), len(r3))]
        eco.append(f"| {b} | " + " | ".join(cells) + " |")
    s2 = [r for r in sq if r["round"] in (2, 14) and r["lost_pistol"]]
    o2 = [r for r in op if r["round"] in (2, 14) and r["lost_pistol"]]
    test("Toutes cartes : force ou full au round 2 après pistol perdu", s2, o2, lambda r: r["buy"] in ("force", "full"), [r for r in s2 if r["buy"] in ("force", "full")])

    kept = benjamini_hochberg(list(tests))
    near = [t for t in tests if t["p"] < 0.05 and t not in kept]
    fmt = lambda t: (f"- **{t['desc']}** : escouade {pct(*t['sq'])}, adversaires {pct(*t['op'])}, p = {t['p']:.4f}"
                     + (f"\n  - Rounds à revoir : {rounds_ref(t['refs'])}" if t["refs"] else ""))
    out.append(f"## Écarts significatifs ({len(kept)} sur {len(tests)} comparaisons, FDR 0.1)\n")
    out += [fmt(t) for t in sorted(kept, key=lambda t: t["p"])] or ["- aucun"]
    out.append("\n## Pistes (p < 0.05, non retenues après correction)\n")
    out += [fmt(t) for t in sorted(near, key=lambda t: t["p"])] or ["- aucune"]
    out += eco + body
    (ROOT / "strategy.md").write_text("\n".join(out) + "\n")
    print("\n".join(out[: 4 + len(kept) + len(near) + 4 + len(eco)]))


if __name__ == "__main__":
    main()
