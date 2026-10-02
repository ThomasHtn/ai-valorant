"""Session report: what happened on one evening, read against the squad's history on each map."""

from collections.abc import Mapping, Sequence

from valostats.analysis.extraction.henrik_payload import HenrikMatch, map_name, match_id, squad_team
from valostats.analysis.extraction.win_probability import WinProbabilityTable
from valostats.analysis.players.roster import roster
from valostats.analysis.session.costly_rounds import costly_rounds
from valostats.analysis.session.grouping import Session
from valostats.analysis.session.history import habits
from valostats.analysis.session.match_points import match_points
from valostats.analysis.session.scoreboard import scoreboard, versus_usual
from valostats.analysis.statistics.rates import rate
from valostats.analysis.team.match_results import squad_only
from valostats.domain.enums import Side, Tone
from valostats.domain.facts import DeathFact, PlayerRoundFact, RoundFact
from valostats.domain.maps import GameMap
from valostats.schemas.session import SessionHighlight, SessionMatch, SessionReport

MAX_HIGHLIGHT_POINTS = 4
MAX_HIGHLIGHT_THROWS = 3


def session_report(
    session: Session,
    payloads: Sequence[HenrikMatch],
    squad: set[str],
    rounds: Sequence[RoundFact],
    deaths: Sequence[DeathFact],
    player_rounds: Sequence[PlayerRoundFact],
    table: WinProbabilityTable,
    maps: Mapping[str, GameMap],
) -> SessionReport:
    """`rounds`, `deaths` and `player_rounds` cover every squad match, so the evening can be compared with the rest."""
    ids = session.match_ids
    profile = habits(rounds, deaths, ids)
    squad_players = squad_only(player_rounds)
    evening = [r for r in squad_players if r.match_id in ids]
    usual = [r for r in squad_players if r.match_id not in ids]

    matches = []
    for payload in sorted(payloads, key=lambda p: p["metadata"]["started_at"]):
        team = squad_team(payload, squad)
        if team is None:
            continue
        mid, name = match_id(payload), map_name(payload)
        rs = [r for r in squad_only(rounds) if r.match_id == mid]
        recurring, unusual = match_points(mid, name, rounds, deaths, profile)
        matches.append(
            SessionMatch(
                match_id=mid,
                map_name=name,
                started_at=rs[0].started_at,
                rounds_won=sum(r.won for r in rs),
                rounds_lost=sum(not r.won for r in rs),
                attack=rate((r for r in rs if r.side is Side.ATTACK), lambda r: r.won),
                defense=rate((r for r in rs if r.side is Side.DEFENSE), lambda r: r.won),
                scoreboard=scoreboard([r for r in evening if r.match_id == mid]),
                recurring=recurring,
                unusual=unusual,
                costly_rounds=costly_rounds(payload, team, rounds, table, maps[name]),
            )
        )

    return SessionReport(
        day=session.day,
        month=f"{session.started_at:%Y-%m}",
        matches=matches,
        highlights=_highlights(matches),
        roster=roster(evening),
        versus_usual=versus_usual(evening, usual),
    )


def _highlights(matches: Sequence[SessionMatch]) -> list[SessionHighlight]:
    """The bad points first, then the costliest throws."""
    points = [
        SessionHighlight(map_name=m.map_name, title=p.title, side=p.side, round_number=None, state=None)
        for m in matches
        for p in m.recurring + m.unusual
        if p.tone is Tone.BAD
    ][:MAX_HIGHLIGHT_POINTS]
    throws = sorted(((m.map_name, c) for m in matches for c in m.costly_rounds), key=lambda x: -x[1].best_chance)[:MAX_HIGHLIGHT_THROWS]
    return points + [
        SessionHighlight(map_name=name, title=c.headline, side=c.side, round_number=c.round_number, state=c.state) for name, c in throws
    ]
