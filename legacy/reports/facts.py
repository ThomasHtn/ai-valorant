"""Round and death facts extracted from Henrik v4 matches, labelled squad / opp."""
from collections import Counter, defaultdict
from datetime import datetime
from zoneinfo import ZoneInfo

from .data import load_maps

TZ = ZoneInfo("Europe/Paris")
TRADE_WINDOW_MS = 3000
FULL_BUY = 3700
ECO = 1500
MAPS = load_maps()
CALLOUTS = {name: [(c["location"]["x"], c["location"]["y"], f'{c["superRegionName"]} {c["regionName"]}') for c in m["callouts"]]
            for name, m in MAPS.items()}


def callout(map_name, loc):
    best = min(CALLOUTS[map_name], key=lambda c: (c[0] - loc["x"]) ** 2 + (c[1] - loc["y"]) ** 2)
    return best[2]


def attacker(round_idx):
    # Red attacks first half, sides swap at 12, then every round in overtime (checked on plants).
    if round_idx < 12:
        return "Red"
    if round_idx < 24:
        return "Blue"
    return "Red" if (round_idx - 24) % 2 == 0 else "Blue"


def alive_after(kill):
    # The kill snapshot lists exactly the players alive after it, revives included.
    alive = Counter(p["player"]["team"] for p in kill["player_locations"])
    return {"Red": alive["Red"], "Blue": alive["Blue"]}


def buy_type(round_idx, loadouts):
    if round_idx in (0, 12):
        return "pistol"
    avg = sum(loadouts) / len(loadouts)
    return "full" if avg >= FULL_BUY else "eco" if avg < ECO else "force"


def started(match):
    return datetime.fromisoformat(match["metadata"]["started_at"].replace("Z", "+00:00")).astimezone(TZ)


def patch(match):
    return match["metadata"]["game_version"].split("-")[1]


def squad_team(match, squad):
    counts = Counter(p["team_id"] for p in match["players"] if p["puuid"] in squad)
    team, n = counts.most_common(1)[0] if counts else (None, 0)
    return team if n >= 5 else None


def round_timelines(match):
    """Per round: ordered (event, ms, alive, planted) states, starting at 5v5."""
    kills_by_round = defaultdict(list)
    for k in match["kills"]:
        kills_by_round[k["round"]].append(k)
    out = {}
    for r in match["rounds"]:
        events = [("kill", k["time_in_round_in_ms"], k) for k in kills_by_round[r["id"]]]
        if r["plant"]:
            events.append(("plant", r["plant"]["round_time_in_ms"], r["plant"]))
        events.sort(key=lambda e: e[1])
        alive, planted = {"Red": 5, "Blue": 5}, False
        states = [(None, 0, dict(alive), planted)]
        for kind, ms, e in events:
            if kind == "plant":
                planted = True
            else:
                alive = alive_after(e)
            states.append(((kind, e), ms, dict(alive), planted))
        out[r["id"]] = {"att": attacker(r["id"]), "winner": r["winning_team"], "states": states}
    return out


def extract(matches, squad=None):
    """Team-round rows and death rows, both teams: squad/opp for squad 5-stacks, or 'top' for every team without a squad."""
    rounds_out, deaths_out = [], []
    for m in matches:
        map_name = m["metadata"]["map"]["name"]
        sq_team = squad_team(m, squad) if squad is not None else None
        if map_name not in CALLOUTS or (squad is not None and not sq_team):
            continue
        label = (lambda team: "squad" if team == sq_team else "opp") if squad is not None else (lambda team: "top")
        base = {"match": m["metadata"]["match_id"], "date": started(m), "patch": patch(m), "map": map_name}
        timelines = round_timelines(m)
        killer_label = lambda team: label(team) if team in ("Red", "Blue") else "env"
        for r in m["rounds"]:
            idx = r["id"]
            att = attacker(idx)
            tl = timelines[idx]
            kills = [ev[1] for ev, _, _, _ in tl["states"][1:] if ev[0] == "kill"]
            plant_ms = r["plant"]["round_time_in_ms"] if r["plant"] else None
            damage = {s["player"]["puuid"]: sum(e["damage"] for e in s["damage_events"]) for s in r["stats"]}
            max_adv = {"Red": 0, "Blue": 0}
            min_adv = {"Red": 0, "Blue": 0}
            visited = {"Red": set(), "Blue": set()}
            alive_at_plant = None
            for ev, ms, alive, planted in tl["states"]:
                for t, o in (("Red", "Blue"), ("Blue", "Red")):
                    max_adv[t] = max(max_adv[t], alive[t] - alive[o])
                    min_adv[t] = min(min_adv[t], alive[t] - alive[o])
                    if alive[t] and alive[o]:
                        visited[t].add(f"{alive[t]}v{alive[o]}")
                if ev and ev[0] == "plant":
                    alive_at_plant = alive
            for i, k in enumerate(kills):
                vt, kt = k["victim"]["team"], k["killer"]["team"]
                avenger = next((k2["killer"]["name"] for k2 in kills[i + 1:]
                                if k2["victim"]["puuid"] == k["killer"]["puuid"] and k2["killer"]["team"] == vt
                                and 0 <= k2["time_in_round_in_ms"] - k["time_in_round_in_ms"] <= TRADE_WINDOW_MS), None)
                traded = avenger is not None
                deaths_out.append({
                    **base, "round": idx, "team": label(vt), "team_id": vt, "avenger": avenger, "name": k["victim"]["name"], "side": "att" if vt == att else "def",
                    "ms": k["time_in_round_in_ms"], "opening": i == 0, "traded": traded,
                    "callout": callout(map_name, k["location"]), "damage": damage.get(k["victim"]["puuid"], 0),
                    "post_plant": plant_ms is not None and k["time_in_round_in_ms"] > plant_ms,
                    "killer_team": killer_label(kt), "killer": k["killer"]["name"], "teamkill": vt == kt,
                })
            for team in ("Red", "Blue"):
                other = "Blue" if team == "Red" else "Red"
                loadouts = [s["economy"]["loadout_value"] for s in r["stats"] if s["player"]["team"] == team]
                opp_loadouts = [s["economy"]["loadout_value"] for s in r["stats"] if s["player"]["team"] == other]
                if len(loadouts) < 5 or len(opp_loadouts) < 5:
                    continue
                rounds_out.append({
                    **base, "round": idx, "team": label(team), "team_id": team, "side": "att" if team == att else "def",
                    "won": r["winning_team"] == team, "first_kill": kills[0]["killer"]["team"] == team if kills else None,
                    "buy": buy_type(idx, loadouts), "opp_buy": buy_type(idx, opp_loadouts), "max_adv": max_adv[team],
                    "planted": plant_ms is not None, "plant_site": r["plant"]["site"] if r["plant"] else None,
                    "adv_at_plant": None if alive_at_plant is None else alive_at_plant[team] - alive_at_plant[other],
                    "min_adv": min_adv[team], "states": sorted(visited[team]), "result": r["result"],
                    "first_ms": kills[0]["time_in_round_in_ms"] if kills else None, "plant_ms": plant_ms,
                    "loadout": sum(loadouts) / 5, "opp_loadout": sum(opp_loadouts) / 5,
                })
    return rounds_out, deaths_out


def player_rounds(matches, squad=None):
    """One row per player and round (combat, opening duels, revenge, clutch, impact), plus one row per player and match."""
    rows, per_match = [], []
    table = win_prob_table(matches)
    for m in matches:
        map_name = m["metadata"]["map"]["name"]
        sq_team = squad_team(m, squad) if squad is not None else None
        if map_name not in CALLOUTS or (squad is not None and not sq_team):
            continue
        label = (lambda team: "squad" if team == sq_team else "opp") if squad is not None else (lambda team: "top")
        base = {"match": m["metadata"]["match_id"], "date": started(m), "patch": patch(m), "map": map_name}
        players = {p["puuid"]: p for p in m["players"]}
        n_rounds = len(m["rounds"])
        team_won = {t["team_id"]: t["won"] for t in m["teams"]}
        for p in m["players"]:
            casts = p.get("ability_casts") or {}
            won = next((t["won"] for t in m["teams"] if t["team_id"] == p["team_id"]), False)
            per_match.append({**base, "team": label(p["team_id"]), "team_id": p["team_id"], "name": p["name"], "puuid": p["puuid"], "agent": p["agent"]["name"],
                              "rounds": n_rounds, "won": won, **{f"cast_{k}": casts.get(k) or 0 for k in ("grenade", "ability1", "ability2", "ultimate")}})
        for idx, tl in round_timelines(m).items():
            r = m["rounds"][idx]
            att = tl["att"]
            kills = [ev[1] for ev, _, _, _ in tl["states"][1:] if ev[0] == "kill"]
            avenged, revenge_kills = set(), set()
            for i, k in enumerate(kills):
                for j in range(i + 1, len(kills)):
                    k2 = kills[j]
                    if (k2["victim"]["puuid"] == k["killer"]["puuid"] and k2["killer"]["team"] == k["victim"]["team"]
                            and 0 <= k2["time_in_round_in_ms"] - k["time_in_round_in_ms"] <= TRADE_WINDOW_MS):
                        avenged.add(i)
                        revenge_kills.add(j)
            # Win probability added: the swing of each kill or plant, credited to the killer/planter and charged to the victim.
            wpa, clutch = defaultdict(float), {}
            prev = tl["states"][0]
            for ev, ms, alive, planted in tl["states"][1:]:
                kind, e = ev
                # The planter is always on attack; Henrik sometimes reports its team as "Unknown".
                actor_team = att if kind == "plant" else e["killer"]["team"]
                if actor_team not in ("Red", "Blue"):
                    # Environmental death (spike, fall): the swing goes against the victim's team, no killer credit.
                    actor_team = "Blue" if e["victim"]["team"] == "Red" else "Red"
                other = "Blue" if actor_team == "Red" else "Red"
                side = "att" if actor_team == att else "def"
                before = win_prob(table, prev[2][actor_team], prev[2][other], side, prev[3])
                after = win_prob(table, alive[actor_team], alive[other], side, planted)
                if kind == "plant":
                    wpa[(e.get("player") or {}).get("puuid")] += after - before
                elif actor_team != e["victim"]["team"]:
                    if e["killer"]["team"] == actor_team:
                        wpa[e["killer"]["puuid"]] += after - before
                    wpa[e["victim"]["puuid"]] -= after - before
                    for t, o in (("Red", "Blue"), ("Blue", "Red")):
                        if alive[t] == 1 and alive[o] >= 1 and t not in clutch:
                            last = next((q["player"]["puuid"] for q in e["player_locations"] if q["player"]["team"] == t), None)
                            clutch[t] = (last, alive[o])
                prev = (ev, ms, alive, planted)
            first = kills[0] if kills and kills[0]["killer"]["team"] != kills[0]["victim"]["team"] else None
            for s in r["stats"]:
                puuid, team = s["player"]["puuid"], s["player"]["team"]
                if puuid not in players:
                    continue
                own_kills = [i for i, k in enumerate(kills) if k["killer"]["puuid"] == puuid and k["victim"]["team"] != team]
                own_deaths = [i for i, k in enumerate(kills) if k["victim"]["puuid"] == puuid]
                assists = sum(any(a["puuid"] == puuid for a in (k.get("assistants") or [])) for k in kills if k["victim"]["team"] != team)
                traded = any(i in avenged for i in own_deaths)
                st = s["stats"]
                fb_loc = fd_loc = None
                if first and first["killer"]["puuid"] == puuid:
                    fb_loc = next((q["location"] for q in first["player_locations"] if q["player"]["puuid"] == puuid), None)
                if first and first["victim"]["puuid"] == puuid:
                    fd_loc = first["location"]
                clutch_vs = clutch[team][1] if team in clutch and clutch[team][0] == puuid else 0
                rows.append({
                    **base, "round": idx, "team": label(team), "side": "att" if team == att else "def", "name": s["player"]["name"],
                    "puuid": puuid, "agent": players[puuid]["agent"]["name"], "won": r["winning_team"] == team, "match_won": team_won.get(team, False),
                    "kills": len(own_kills), "deaths": len(own_deaths), "assists": assists, "score": st["score"],
                    "damage": sum(e["damage"] for e in s["damage_events"]), "hs": st["headshots"], "bs": st["bodyshots"], "ls": st["legshots"],
                    "survived": not own_deaths, "traded": traded, "kast": bool(own_kills or assists or not own_deaths or traded),
                    "revenge_given": sum(i in revenge_kills for i in own_kills),
                    "fb": fb_loc is not None or bool(first and first["killer"]["puuid"] == puuid), "fd": bool(first and first["victim"]["puuid"] == puuid),
                    "fb_loc": fb_loc, "fd_loc": fd_loc, "clutch_vs": clutch_vs, "clutch_won": bool(clutch_vs) and r["winning_team"] == team,
                    "wpa": wpa[puuid], "death_ms": kills[own_deaths[0]]["time_in_round_in_ms"] if own_deaths else None,
                    "zero_damage_death": bool(own_deaths) and sum(e["damage"] for e in s["damage_events"]) == 0,
                    "loadout": s["economy"]["loadout_value"], "weapon": ((s["economy"].get("weapon") or {}).get("name")),
                    "kill_weapons": [(kills[i].get("weapon") or {}).get("name") for i in own_kills],
                    "death_spot": callout(map_name, kills[own_deaths[0]]["location"]) if own_deaths else None,
                })
    return rows, per_match


def win_prob_table(matches):
    """Empirical (wins, n) per (own alive, opp alive, side, planted), both teams of every match."""
    counts = defaultdict(lambda: [0, 0])
    for m in matches:
        for tl in round_timelines(m).values():
            for _, _, alive, planted in tl["states"]:
                for team, other in (("Red", "Blue"), ("Blue", "Red")):
                    key = (alive[team], alive[other], "att" if team == tl["att"] else "def", planted)
                    counts[key][0] += tl["winner"] == team
                    counts[key][1] += 1
    return counts


def win_prob(table, mine, theirs, side, planted):
    if mine == 0:
        return 0.0
    if theirs == 0:
        return 1.0
    won, n = table.get((mine, theirs, side, planted), (0, 0))
    return (won + 1) / (n + 2)
