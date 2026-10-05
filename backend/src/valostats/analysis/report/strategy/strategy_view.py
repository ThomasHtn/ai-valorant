"""Stratégie view of one map: top ranked compositions and agents, habits priced in rounds, plants and defensive contacts."""

from collections import Counter, defaultdict
from collections.abc import Sequence

from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohort, ReportCohorts
from valostats.analysis.report.rounds.minimap import density
from valostats.analysis.report.strategy.habits import habits
from valostats.constants.agents import role_of
from valostats.constants.rounds import MINIMAP_DECIMALS, PLANT_GRID_CELLS
from valostats.constants.strategy import CONTACT_ZONES, TOP_COMPS
from valostats.domain.enums import Side
from valostats.domain.facts import KillFact, Location, MatchFact, RoundFact
from valostats.domain.maps import GameMap
from valostats.domain.patches import patch_sort_key
from valostats.schemas.common import Rate
from valostats.schemas.report.minimap import Callout
from valostats.schemas.report.strategy import AgentPick, CompLine, ContactZone, SiteShare, SquadPlant, StrategyView


def strategy_view(cohorts: ReportCohorts, game_map: GameMap) -> StrategyView:
    name = game_map.name
    top_matches: Sequence[MatchFact] = cohorts.select(FactKind.MATCHES, ReportCohort.TOP, map_name=name)
    squad_matches = [m for m in cohorts.matches() if m.map_name == name]
    squad_comps = _comps(squad_matches)
    attack: dict[ReportCohort, Sequence[RoundFact]] = {
        c: cohorts.select(FactKind.ROUNDS, c, map_name=name, side=Side.ATTACK) for c in (ReportCohort.SQUAD, ReportCohort.TOP)
    }
    return StrategyView(
        map_name=name,
        minimap_url=game_map.minimap_url,
        callouts=[_callout(game_map, c.name, c.x, c.y) for c in game_map.callouts],
        top_matches=len({m.match_id for m in top_matches}),
        patches=sorted({m.patch for m in top_matches}, key=patch_sort_key),
        squad_matches=Rate(count=sum(m.won for m in squad_matches), total=len(squad_matches)),
        comps=_comps(top_matches)[:TOP_COMPS],
        squad_comp=squad_comps[0] if squad_comps else None,
        agents=_agents(top_matches, {a for m in squad_matches for a in m.agents}),
        habits=habits(cohorts, name, len(squad_matches)),
        sites=_sites(attack[ReportCohort.SQUAD], attack[ReportCohort.TOP]),
        top_plants=density((game_map.to_minimap(r.plant_location) for r in attack[ReportCohort.TOP] if r.plant_location), PLANT_GRID_CELLS),
        squad_plants=[_plant(game_map, r) for r in attack[ReportCohort.SQUAD] if r.plant_location],
        contacts=_contacts(cohorts, name),
    )


def _comps(matches: Sequence[MatchFact]) -> list[CompLine]:
    """Compositions of these team-matches, the most played first."""
    groups: defaultdict[tuple[str, ...], list[MatchFact]] = defaultdict(list)
    for m in matches:
        groups[tuple(sorted(m.agents))].append(m)
    lines = [
        CompLine(
            agents=list(agents),
            matches=len(group),
            share=round(len(group) / len(matches), 4),
            rounds=Rate(count=sum(m.rounds_won for m in group), total=sum(m.rounds for m in group)),
        )
        for agents, group in groups.items()
    ]
    return sorted(lines, key=lambda c: (-c.matches, c.agents))


def _agents(top_matches: Sequence[MatchFact], squad_agents: set[str]) -> list[AgentPick]:
    """Share of top ranked team-matches with each agent, the most played first."""
    picks = Counter(a for m in top_matches for a in set(m.agents))
    total = len(top_matches)
    return [
        AgentPick(agent=a, role=role_of(a), share=round(n / total, 4), squad=a in squad_agents)
        for a, n in sorted(picks.items(), key=lambda x: (-x[1], x[0]))
    ]


def _sites(squad: Sequence[RoundFact], top: Sequence[RoundFact]) -> list[SiteShare]:
    squad_plants = [r for r in squad if r.planted and r.plant_site]
    top_plants = [r for r in top if r.planted and r.plant_site]
    sites = sorted({r.plant_site for r in [*squad_plants, *top_plants] if r.plant_site})
    lines = []
    for site in sites:
        top_here = [r for r in top_plants if r.plant_site == site]
        squad_here = [r for r in squad_plants if r.plant_site == site]
        lines.append(
            SiteShare(
                site=site,
                top=Rate(count=len(top_here), total=len(top_plants)),
                squad=Rate(count=len(squad_here), total=len(squad_plants)),
                top_won=Rate(count=sum(r.won for r in top_here), total=len(top_here)),
                squad_won=Rate(count=sum(r.won for r in squad_here), total=len(squad_here)),
            )
        )
    return lines


def _contacts(cohorts: ReportCohorts, map_name: str) -> list[ContactZone]:
    """Zones of the defender in each opening duel of a defense round, the zones the top ranked use most first."""
    top = _defense_openings(cohorts, ReportCohort.TOP, map_name)
    squad = _defense_openings(cohorts, ReportCohort.SQUAD, map_name)
    lines = []
    for zone, _ in Counter(z for z, _ in top).most_common(CONTACT_ZONES):
        top_here = [won for z, won in top if z == zone]
        squad_here = [won for z, won in squad if z == zone]
        lines.append(
            ContactZone(
                zone=zone,
                top=Rate(count=len(top_here), total=len(top)),
                squad=Rate(count=len(squad_here), total=len(squad)),
                top_won=Rate(count=sum(top_here), total=len(top_here)),
                squad_won=Rate(count=sum(squad_here), total=len(squad_here)),
            )
        )
    return lines


def _defense_openings(cohorts: ReportCohorts, cohort: ReportCohort, map_name: str) -> list[tuple[str, bool]]:
    """(defender's zone, defender won) of each opening duel the cohort played on defense."""
    lost: Sequence[KillFact] = cohorts.select(FactKind.DEATHS, cohort, map_name=map_name)
    won: Sequence[KillFact] = cohorts.select(FactKind.KILLS, cohort, map_name=map_name)
    duels = [(k.victim_zone, False) for k in lost if k.opening and k.victim_side is Side.DEFENSE]
    duels += [(k.killer_zone, True) for k in won if k.opening and k.victim_side is Side.ATTACK and k.killer_zone]
    return [(zone, defender_won) for zone, defender_won in duels if zone]


def _plant(game_map: GameMap, r: RoundFact) -> SquadPlant:
    x, y = game_map.to_minimap(r.plant_location or Location(0, 0))
    return SquadPlant(x=round(x, MINIMAP_DECIMALS), y=round(y, MINIMAP_DECIMALS), site=r.plant_site, won=r.won)


def _callout(game_map: GameMap, name: str, gx: float, gy: float) -> Callout:
    x, y = game_map.to_minimap(Location(gx, gy))
    return Callout(name=name, x=round(x, MINIMAP_DECIMALS), y=round(y, MINIMAP_DECIMALS))
