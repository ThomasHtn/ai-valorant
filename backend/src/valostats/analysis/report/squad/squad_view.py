"""Escouade view: headline figures, situations in rounds against the top ranked, maps, sites and roster.

Every situation is also measured map by map, so the front can tell a squad habit (red on every map)
from a map problem (one red cell).
"""

from collections.abc import Sequence

from valostats.analysis.extraction.win_probability import WinProbabilityTable
from valostats.analysis.report.foundation.cells import squad_player_cell
from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohorts, SquadPlayer
from valostats.analysis.report.foundation.player_metrics import acs, adr, headshot_rate, kast, opening_duels_won, revenge_rate
from valostats.analysis.report.players.situations import player_situation_by_key
from valostats.analysis.report.rounds.round_lines import round_lines
from valostats.analysis.report.rounds.round_states import kills_by_round
from valostats.analysis.report.squad.gaps import gap
from valostats.analysis.report.squad.months import by_month, kpis_before, month_points, shown_months
from valostats.analysis.report.squad.situations import SITUATIONS, SituationRule
from valostats.domain.enums import BuyType, Side
from valostats.domain.facts import PlayerRoundFact, RoundFact
from valostats.schemas.common import Rate
from valostats.schemas.report.player import PlayerSituation
from valostats.schemas.report.squad import (
    MapGap,
    MapLine,
    RosterLine,
    SiteLine,
    Situation,
    SituationPlayer,
    SquadKpis,
    SquadView,
)

# Squad situations a single player decides, broken down player by player.
PLAYER_SITUATIONS = frozenset({"duel-attack", "duel-defense"})


def _every(_: RoundFact) -> bool:
    return True


def _won(r: RoundFact) -> bool:
    return r.won


def squad_view(cohorts: ReportCohorts, table: WinProbabilityTable) -> SquadView:
    maps = cohorts.maps()
    months = shown_months(cohorts)
    by_player = {p: player_situation_by_key(cohorts, p) for p in cohorts.players()}
    return SquadView(
        kpis=_kpis(cohorts, table),
        months=month_points(cohorts, months),
        situations=[_situation(cohorts, rule, maps, by_player) for rule in SITUATIONS],
        maps=[_map_line(cohorts, m) for m in maps],
        post_plant=_sites(cohorts, maps, Side.ATTACK),
        retakes=_sites(cohorts, maps, Side.DEFENSE),
        roster=_roster(cohorts, months),
    )


def _kpis(cohorts: ReportCohorts, table: WinProbabilityTable) -> SquadKpis:
    matches = cohorts.matches()
    rounds: Sequence[RoundFact] = cohorts.squad(FactKind.ROUNDS)
    kills = kills_by_round([*cohorts.squad(FactKind.DEATHS), *cohorts.squad(FactKind.KILLS)])
    lines = round_lines(rounds, kills, table, {})
    lost = [line for line in lines if not line.won]
    return SquadKpis(
        wins=Rate(count=sum(m.won for m in matches), total=len(matches)),
        rounds=gap(cohorts, FactKind.ROUNDS, _won, _every),
        first_duels=gap(cohorts, FactKind.ROUNDS, lambda r: r.first_kill is True, lambda r: r.first_kill is not None),
        pistols=gap(cohorts, FactKind.ROUNDS, _won, lambda r: r.buy is BuyType.PISTOL),
        turning=sum(line.thrown for line in lost),
        lost=len(lost),
        before=kpis_before(cohorts),
    )


def _situation(
    cohorts: ReportCohorts,
    rule: SituationRule,
    maps: Sequence[str],
    by_player: dict[SquadPlayer, dict[str, PlayerSituation]],
) -> Situation:
    players = [_player_line(p, lines[rule.key]) for p, lines in by_player.items() if rule.key in PLAYER_SITUATIONS and lines[rule.key].n]
    return Situation(
        key=rule.key,
        label=rule.label,
        detail=rule.detail,
        group=rule.group,
        gap=gap(cohorts, FactKind.ROUNDS, rule.success, rule.among),
        maps=[MapGap(map_name=m, gap=gap(cohorts, FactKind.ROUNDS, rule.success, rule.among, map_name=m)) for m in maps],
        players=sorted(players, key=lambda p: (p.cost is None, p.cost or 0)),
    )


def _player_line(player: SquadPlayer, line: PlayerSituation) -> SituationPlayer:
    return SituationPlayer(name=player.name, portrait=player.portrait, role=player.role, k=line.k, n=line.n, top=line.top, cost=line.cost)


def _map_line(cohorts: ReportCohorts, map_name: str) -> MapLine:
    matches = [m for m in cohorts.matches() if m.map_name == map_name]
    return MapLine(
        map_name=map_name,
        matches=len(matches),
        wins=sum(m.won for m in matches),
        attack=gap(cohorts, FactKind.ROUNDS, _won, _every, map_name=map_name, side=Side.ATTACK),
        defense=gap(cohorts, FactKind.ROUNDS, _won, _every, map_name=map_name, side=Side.DEFENSE),
    )


def _sites(cohorts: ReportCohorts, maps: Sequence[str], side: Side) -> list[SiteLine]:
    """Post-plant (attack) or retake (defense) on every site where the squad met a plant."""
    lines: list[SiteLine] = []
    for map_name in maps:
        rounds: Sequence[RoundFact] = cohorts.squad(FactKind.ROUNDS, map_name=map_name, side=side)
        for site in sorted({r.plant_site for r in rounds if r.planted and r.plant_site}):

            def at_site(r: RoundFact, site: str = site) -> bool:
                return r.planted and r.plant_site == site

            lines.append(
                SiteLine(map_name=map_name, site=site, gap=gap(cohorts, FactKind.ROUNDS, _won, at_site, map_name=map_name, side=side))
            )
    return lines


def _roster(cohorts: ReportCohorts, months: Sequence[str]) -> list[RosterLine]:
    rounds = by_month(cohorts, FactKind.PLAYER_ROUNDS, months)
    return [_roster_line(cohorts, p, [_acs_of(rounds[m], p.name) for m in months]) for p in cohorts.players()]


def _acs_of(rounds: Sequence[PlayerRoundFact], name: str) -> float | None:
    value, _ = acs([r for r in rounds if r.name == name])
    return round(value, 1) if value is not None else None


def _roster_line(cohorts: ReportCohorts, player: SquadPlayer, acs_months: list[float | None]) -> RosterLine:
    own: Sequence[PlayerRoundFact] = [p for p in cohorts.squad(FactKind.PLAYER_ROUNDS) if p.name == player.name]
    matches = {p.match_id for p in cohorts.squad(FactKind.PLAYER_MATCHES) if p.name == player.name}
    return RosterLine(
        name=player.name,
        portrait=player.portrait,
        matches=len(matches),
        acs=squad_player_cell(cohorts, FactKind.PLAYER_ROUNDS, acs, player),
        adr=squad_player_cell(cohorts, FactKind.PLAYER_ROUNDS, adr, player),
        kast=squad_player_cell(cohorts, FactKind.PLAYER_ROUNDS, kast, player),
        headshots=squad_player_cell(cohorts, FactKind.PLAYER_ROUNDS, headshot_rate, player),
        opening=squad_player_cell(cohorts, FactKind.PLAYER_ROUNDS, opening_duels_won, player),
        opening_record=f"{sum(p.first_blood for p in own)}-{sum(p.first_death for p in own)}",
        traded=squad_player_cell(cohorts, FactKind.PLAYER_ROUNDS, revenge_rate, player),
        acs_months=acs_months,
    )
