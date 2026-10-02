"""Template review of a single match, to compare with aggregated patterns."""
import json
import sys
from collections import Counter
from pathlib import Path

DATA = Path(__file__).parent / "data"


def main(match_id=None):
    facts = json.load(open(DATA / "facts.json"))
    tr = facts["team_rounds"]
    match_id = match_id or tr[-1]["match"]
    rounds = [r for r in tr if r["match"] == match_id and r["team"] == "squad"]
    deaths = [d for d in facts["deaths"] if d["match"] == match_id and not d["teamkill"]]
    won = sum(r["won"] for r in rounds)
    out = [f"# Review du match {match_id} ({rounds[0]['map']}, {won}-{len(rounds) - won})\n"]

    openings = [d for d in deaths if d["opening"] and d["team"] == "squad"]
    out.append(f"- Premières morts : {len(openings)}/{len(rounds)} rounds, échangées {sum(d['traded'] for d in openings)}. "
               + ", ".join(f"{n} x{c}" for n, c in Counter(d["name"] for d in openings).most_common()))
    lost_adv = [r["round"] + 1 for r in rounds if r["first_kill"] and not r["won"]]
    out.append(f"- Rounds perdus après le premier kill : {lost_adv}")
    lost_2 = [r["round"] + 1 for r in rounds if r["max_adv"] >= 2 and not r["won"]]
    out.append(f"- Rounds perdus avec 2 joueurs d'avance ou plus : {lost_2}")
    plants = [r for r in rounds if r["planted"] and r["side"] == "att"]
    out.append(f"- Post-plant en attaque : {sum(r['won'] for r in plants)}/{len(plants)} gagnés")
    retakes = [r for r in rounds if r["planted"] and r["side"] == "def"]
    out.append(f"- Retakes : {sum(r['won'] for r in retakes)}/{len(retakes)} réussis")
    forces = [r for r in rounds if r["buy"] == "force"]
    out.append(f"- Forces : {sum(r['won'] for r in forces)}/{len(forces)} gagnés (rounds {[r['round'] + 1 for r in forces]})")
    untraded = Counter(d["name"] for d in deaths if d["team"] == "squad" and not d["traded"] and d["damage"] == 0)
    out.append("- Morts sans dégâts et sans échange : " + ", ".join(f"{n} x{c}" for n, c in untraded.most_common()))
    print("\n".join(out))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else None)
