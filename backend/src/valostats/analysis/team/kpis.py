"""Headline tiles of the period, with their change against the comparison period."""

from collections.abc import Callable, Sequence
from typing import Any

from valostats.analysis.statistics.rates import rate
from valostats.analysis.team.match_results import squad_matches, squad_only
from valostats.domain.enums import BuyType, Side
from valostats.domain.facts import PlayerRoundFact, RoundFact
from valostats.schemas.period.team import KpiRate, TeamKpis


def team_kpis(
    comparison_label: str,
    rounds: Sequence[RoundFact],
    player_rounds: Sequence[PlayerRoundFact],
    previous_rounds: Sequence[RoundFact],
    previous_player_rounds: Sequence[PlayerRoundFact],
) -> TeamKpis:
    squad, previous = squad_only(rounds), squad_only(previous_rounds)
    players, previous_players = squad_only(player_rounds), squad_only(previous_player_rounds)
    matches = squad_matches(rounds).values()
    wins = sum(m.won for m in matches)

    def kpi(
        now: Sequence[Any], before: Sequence[Any], success: Callable[[Any], object], applies: Callable[[Any], bool] = lambda r: True
    ) -> KpiRate:
        previous_rate = rate((r for r in before if applies(r)), success)
        return KpiRate(current=rate((r for r in now if applies(r)), success), previous=previous_rate if previous_rate.total else None)

    return TeamKpis(
        comparison_label=comparison_label,
        wins=wins,
        losses=len(matches) - wins,
        rounds_won=kpi(squad, previous, lambda r: r.won),
        attack=kpi(squad, previous, lambda r: r.won, lambda r: r.side is Side.ATTACK),
        defense=kpi(squad, previous, lambda r: r.won, lambda r: r.side is Side.DEFENSE),
        pistols=rate((r for r in squad if r.buy is BuyType.PISTOL), lambda r: r.won),
        first_blood=kpi(squad, previous, lambda r: r.first_kill, lambda r: r.first_kill is not None),
        kast=kpi(players, previous_players, lambda r: r.kast),
        traded_deaths=rate((r for r in players if r.deaths), lambda r: r.traded),
    )
