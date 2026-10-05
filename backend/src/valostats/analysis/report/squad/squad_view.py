"""Escouade view: headline figures, situations in rounds against the top ranked, maps, sites and roster.

Every situation is also measured map by map, so the front can tell a squad habit (red on every map)
from a map problem (one red cell).
"""

from collections.abc import Sequence

from valostats.analysis.extraction.win_probability import WinProbabilityTable
from valostats.analysis.report.foundation.cells import player_cell
from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohorts, SquadPlayer
from valostats.analysis.report.foundation.player_metrics import acs, adr, headshot_rate, kast, opening_duels_won, revenge_rate
from valostats.analysis.report.rounds.round_lines import round_lines
from valostats.analysis.report.rounds.round_states import kills_by_round
from valostats.analysis.report.squad.gaps import gap
from valostats.analysis.report.squad.situations import SITUATIONS, SituationRule
from valostats.domain.enums import BuyType, Side
from valostats.domain.facts import PlayerRoundFact, RoundFact
from valostats.schemas.common import Rate
from valostats.schemas.report.squad import MapGap, MapLine, RosterLine, SiteLine, Situation, SquadKpis, SquadView


def _every(_: RoundFact) -> bool:
    return True


def _won(r: RoundFact) -> bool:
    return r.won


def squad_view(cohorts: ReportCohorts, table: WinProbabilityTable) -> SquadView:
    maps = cohorts.maps()
    return SquadView(
        kpis=_kpis(cohorts, table),
        situations=[_situation(cohorts, rule, maps) for rule in SITUATIONS],
        maps=[_map_line(cohorts, m) for m in maps],
        post_plant=_sites(cohorts, maps, Side.ATTACK),
        retakes=_sites(cohorts, maps, Side.DEFENSE),
        roster=[_roster_line(cohorts, p) for p in cohorts.players()],
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
    )


def _situation(cohorts: ReportCohorts, rule: SituationRule, maps: Sequence[str]) -> Situation:
    return Situation(
        key=rule.key,
        label=rule.label,
        detail=rule.detail,
        group=rule.group,
        gap=gap(cohorts, FactKind.ROUNDS, rule.success, rule.among),
        maps=[MapGap(map_name=m, gap=gap(cohorts, FactKind.ROUNDS, rule.success, rule.among, map_name=m)) for m in maps],
    )


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


def _roster_line(cohorts: ReportCohorts, player: SquadPlayer) -> RosterLine:
    own: Sequence[PlayerRoundFact] = [p for p in cohorts.squad(FactKind.PLAYER_ROUNDS) if p.name == player.name]
    matches = {p.match_id for p in cohorts.squad(FactKind.PLAYER_MATCHES) if p.name == player.name}
    return RosterLine(
        name=player.name,
        portrait=player.portrait,
        role=player.role,
        matches=len(matches),
        acs=player_cell(cohorts, FactKind.PLAYER_ROUNDS, acs, player),
        adr=player_cell(cohorts, FactKind.PLAYER_ROUNDS, adr, player),
        kast=player_cell(cohorts, FactKind.PLAYER_ROUNDS, kast, player),
        headshots=player_cell(cohorts, FactKind.PLAYER_ROUNDS, headshot_rate, player),
        opening=player_cell(cohorts, FactKind.PLAYER_ROUNDS, opening_duels_won, player),
        opening_record=f"{sum(p.first_blood for p in own)}-{sum(p.first_death for p in own)}",
        traded=player_cell(cohorts, FactKind.PLAYER_ROUNDS, revenge_rate, player),
    )
