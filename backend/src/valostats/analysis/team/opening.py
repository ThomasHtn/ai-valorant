"""Opening duels: who takes the first blood, what it means for the round, where it happens."""

from collections import Counter
from collections.abc import Mapping, Sequence
from statistics import median

from valostats.analysis.statistics.rates import rate
from valostats.analysis.team.duel_maps import duel_map
from valostats.analysis.team.match_results import squad_only
from valostats.constants.analysis import MIN_MAP_MATCHES
from valostats.domain.enums import Side
from valostats.domain.facts import PlayerRoundFact, RoundFact
from valostats.domain.maps import GameMap
from valostats.schemas.common import RateVsReference
from valostats.schemas.period.team import Opening, OpeningPlayer, OpeningSide


def opening(
    rounds: Sequence[RoundFact], player_rounds: Sequence[PlayerRoundFact], top_rounds: Sequence[RoundFact], maps: Mapping[str, GameMap]
) -> Opening:
    squad = squad_only(rounds)
    sides = []
    for side in Side:
        rs = [r for r in squad if r.side is side]
        ts = [r for r in top_rounds if r.side is side]
        times = [r.first_kill_ms / 1000 for r in rs if r.first_kill_ms is not None]
        sides.append(
            OpeningSide(
                side=side,
                first_blood=rate((r for r in rs if r.first_kill is not None), lambda r: r.first_kill),
                convert=RateVsReference(
                    squad=rate((r for r in rs if r.first_kill is True), lambda r: r.won),
                    reference=rate((r for r in ts if r.first_kill is True), lambda r: r.won),
                ),
                recover=RateVsReference(
                    squad=rate((r for r in rs if r.first_kill is False), lambda r: r.won),
                    reference=rate((r for r in ts if r.first_kill is False), lambda r: r.won),
                ),
                median_first_kill_s=median(times) if times else None,
            )
        )

    squad_players = squad_only(player_rounds)
    duel_maps = []
    for map_name, _ in Counter(r.map_name for r in squad).most_common():
        if len({r.match_id for r in squad if r.map_name == map_name}) < MIN_MAP_MATCHES:
            continue
        for side in Side:
            duel_maps.append(duel_map(maps[map_name], side, [p for p in squad_players if p.map_name == map_name and p.side is side]))

    return Opening(
        sides=sides,
        duel_maps=duel_maps,
        top_convert=rate((r for r in top_rounds if r.first_kill is True), lambda r: r.won),
        top_recover=rate((r for r in top_rounds if r.first_kill is False), lambda r: r.won),
        players=_by_player(squad_players),
    )


def _by_player(squad_players: Sequence[PlayerRoundFact]) -> list[OpeningPlayer]:
    """Each player's opening duels and what the team made of them."""
    rows = []
    for name, _ in Counter(p.name for p in squad_players).most_common():
        mine = [p for p in squad_players if p.name == name]
        first_bloods = [p for p in mine if p.first_blood]
        first_deaths = [p for p in mine if p.first_death]
        rows.append(
            OpeningPlayer(
                name=name,
                first_bloods=len(first_bloods),
                won_after_first_blood=rate(first_bloods, lambda p: p.won),
                first_deaths=len(first_deaths),
                won_after_first_death=rate(first_deaths, lambda p: p.won),
                first_deaths_traded=rate(first_deaths, lambda p: p.traded),
            )
        )
    return rows
