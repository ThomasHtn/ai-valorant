"""Form over the period and results per map."""

from collections.abc import Sequence

from valostats.analysis.statistics.rates import rate
from valostats.analysis.team.match_results import squad_matches, squad_only
from valostats.domain.enums import BuyType, Side
from valostats.domain.facts import RoundFact
from valostats.schemas.period.team import MapPoolRow


def map_pool(rounds: Sequence[RoundFact]) -> list[MapPoolRow]:
    """Most played map first."""
    squad = squad_only(rounds)
    matches = list(squad_matches(rounds).values())
    played = sorted({m.map_name for m in matches}, key=lambda name: (-sum(m.map_name == name for m in matches), name))
    rows = []
    for map_name in played:
        on_map = [m for m in matches if m.map_name == map_name]
        rs = [r for r in squad if r.map_name == map_name]
        wins = sum(m.won for m in on_map)
        rows.append(
            MapPoolRow(
                map_name=map_name,
                matches=len(on_map),
                wins=wins,
                losses=len(on_map) - wins,
                rounds=rate(rs, lambda r: r.won),
                attack=rate((r for r in rs if r.side is Side.ATTACK), lambda r: r.won),
                defense=rate((r for r in rs if r.side is Side.DEFENSE), lambda r: r.won),
                pistols=rate((r for r in rs if r.buy is BuyType.PISTOL), lambda r: r.won),
                first_blood=rate((r for r in rs if r.first_kill is not None), lambda r: r.first_kill),
                post_plant=rate((r for r in rs if r.side is Side.ATTACK and r.planted), lambda r: r.won),
                retake=rate((r for r in rs if r.side is Side.DEFENSE and r.planted), lambda r: r.won),
            )
        )
    return rows
