"""Usage: python3 -m reports sync | sync-top | top-status | session [YYYY-MM-DD] | period [YYYY-MM | patch X.YY | YYYY-MM-DD YYYY-MM-DD]"""
import sys

from . import period, session, top
from .data import OUT, load_matches, load_squad, sync
from .page import esc, page


MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]


def label(stem):
    """Readable name of a report from its file name."""
    kind, _, rest = stem.partition("-")
    if kind == "session":
        return f"Session du {rest[8:10]}/{rest[5:7]}/{rest[:4]}"
    if rest.startswith("patch-"):
        return f"Patch {rest[6:]}"
    if "_" in rest:
        start, end = rest.split("_")
        return f"Du {start[8:10]}/{start[5:7]}/{start[:4]} au {end[8:10]}/{end[5:7]}/{end[:4]}"
    return f"{MONTHS[int(rest[5:7]) - 1].capitalize()} {rest[:4]}"


def write_index():
    """Reports grouped by kind, newest first."""
    items = [p for p in OUT.glob("*.html") if p.name != "index.html"]
    groups = [("Sessions", sorted((p for p in items if p.stem.startswith("session")), key=lambda p: p.stem, reverse=True)),
              ("Périodes", sorted((p for p in items if p.stem.startswith("period")), key=lambda p: p.stat().st_mtime, reverse=True))]
    body = ["<h1>Rapports</h1>"]
    for title, files in groups:
        links = "".join(f'<li><a href="{esc(p.name)}">{esc(label(p.stem))}</a></li>' for p in files)
        body.append(f"<h2>{title}</h2><ul>{links or '<li class=\"muted\">Aucun</li>'}</ul>")
    (OUT / "index.html").write_text(page("Rapports", "".join(body)))


def main(args):
    if not args or args[0] not in ("sync", "sync-top", "top-status", "session", "period"):
        raise SystemExit(__doc__)
    if args[0] in ("sync", "sync-top", "top-status"):
        {"sync": sync, "sync-top": top.sync_top, "top-status": top.status}[args[0]]()
        return
    matches, squad = load_matches(), load_squad()
    path = session.build(matches, squad, args[1] if len(args) > 1 else None) if args[0] == "session" else period.build(matches, squad, args[1:])
    write_index()
    print(path)


if __name__ == "__main__":
    main(sys.argv[1:])
