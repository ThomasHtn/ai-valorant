"""Map sheet: everything about one map in one place, against top ranked games on the same map."""

from collections import Counter
from collections.abc import Callable, Sequence

from valostats.analysis.insights.compositions import compositions_by_map, count_compositions
from valostats.analysis.period.rewatch import round_ref
from valostats.analysis.players.breakdowns import kill_death_ratio
from valostats.analysis.players.metrics import StatAccumulator
from valostats.analysis.statistics.rates import rate
from valostats.analysis.team.duel_maps import duel_map
from valostats.analysis.team.match_results import squad_matches, squad_only
from valostats.constants.analysis import MIN_TOP_MAP_MATCHES, MIN_TOP_REFERENCE_ROUNDS, THROW_ADVANTAGE
from valostats.domain.enums import BuyType, Cohort, Side
from valostats.domain.facts import DeathFact, PlayerMatchFact, PlayerRoundFact, RoundFact
from valostats.domain.maps import GameMap
from valostats.schemas.common import CenteredRate, Rate
from valostats.schemas.period.findings import Finding
from valostats.schemas.period.map_sheet import (
    AgentPresence,
    FirstDeathSpot,
    MapCompositionsDetail,
    MapKpi,
    MapPlayerRow,
    MapSheet,
    MapSide,
    MapSiteRow,
    TopComposition,
)

# Neutral colouring centers when top ranked data is too thin: typical 5v4 and 4v5 round win rates.
DEFAULT_CONVERT_CENTER = 0.69
DEFAULT_RECOVER_CENTER = 0.3
MAX_SPOTS = 5
MAX_COMPOSITIONS = 5
MAX_TOP_AGENTS = 10
MAX_THROW_REFS = 10


def _centered(squad: Rate, reference: Rate, has_top: bool, fallback: float = 0.5) -> CenteredRate:
    center = reference.value if reference.value is not None and reference.total >= MIN_TOP_REFERENCE_ROUNDS else fallback
    return CenteredRate(squad=squad, reference=reference if has_top else None, center=center)


def map_sheet(
    game_map: GameMap,
    rounds: Sequence[RoundFact],
    deaths: Sequence[DeathFact],
    player_rounds: Sequence[PlayerRoundFact],
    player_matches: Sequence[PlayerMatchFact],
    top_rounds: Sequence[RoundFact],
    top_player_matches: Sequence[PlayerMatchFact],
    findings: list[Finding],
) -> MapSheet:
    name = game_map.name
    squad = [r for r in squad_only(rounds) if r.map_name == name]
    top = [r for r in top_rounds if r.map_name == name]
    top_matches = len({r.match_id for r in top})
    has_top = top_matches >= MIN_TOP_MAP_MATCHES
    matches = [m for m in squad_matches(rounds).values() if m.map_name == name]
    wins = sum(m.won for m in matches)

    def kpi(key: str, label: str, success: Callable[[RoundFact], object], applies: Callable[[RoundFact], bool] = lambda r: True) -> MapKpi:
        top_rate = rate((r for r in top if applies(r)), success)
        return MapKpi(
            key=key,
            label=label,
            squad=rate((r for r in squad if applies(r)), success),
            top=top_rate if has_top and top_rate.total else None,
        )

    squad_players = [p for p in squad_only(player_rounds) if p.map_name == name]
    squad_deaths = [d for d in squad_only(deaths) if d.map_name == name]
    throws = [r for r in squad if r.max_advantage >= THROW_ADVANTAGE and not r.won]
    return MapSheet(
        map_name=name,
        minimap_url=game_map.minimap_url,
        matches=len(matches),
        wins=wins,
        losses=len(matches) - wins,
        rounds=len(squad),
        top_matches=top_matches,
        has_top_reference=has_top,
        kpis=[
            kpi("rounds", "Rounds gagnés", lambda r: r.won),
            kpi("attack", "En attaque", lambda r: r.won, lambda r: r.side is Side.ATTACK),
            kpi("defense", "En défense", lambda r: r.won, lambda r: r.side is Side.DEFENSE),
            kpi("pistols", "Pistols", lambda r: r.won, lambda r: r.buy is BuyType.PISTOL),
            kpi("first_blood", "First blood", lambda r: r.first_kill, lambda r: r.first_kill is not None),
            kpi("post_plant", "Post-plant gagné", lambda r: r.won, lambda r: r.side is Side.ATTACK and r.planted),
            kpi("retake", "Retake réussi", lambda r: r.won, lambda r: r.side is Side.DEFENSE and r.planted),
        ],
        findings=findings,
        sides=[_side(game_map, side, squad, top, squad_players, squad_deaths, has_top) for side in Side],
        compositions=_compositions(name, player_matches, top_player_matches, has_top),
        players=_players(squad_players),
        throws=len(throws),
        throw_rewatch=[round_ref(r) for r in sorted(throws, key=lambda r: r.started_at, reverse=True)[:MAX_THROW_REFS]],
    )


def _side(
    game_map: GameMap,
    side: Side,
    squad: Sequence[RoundFact],
    top: Sequence[RoundFact],
    squad_players: Sequence[PlayerRoundFact],
    squad_deaths: Sequence[DeathFact],
    has_top: bool,
) -> MapSide:
    rs = [r for r in squad if r.side is side]
    ts = [r for r in top if r.side is side]
    planted = [r for r in rs if r.planted]
    top_planted = [r for r in ts if r.planted]
    sites = []
    for site in sorted({r.plant_site for r in planted + top_planted if r.plant_site}):
        ours = [r for r in planted if r.plant_site == site]
        theirs = [r for r in top_planted if r.plant_site == site]
        sites.append(
            MapSiteRow(
                site=site,
                share=Rate(count=len(ours), total=len(planted)),
                top_share=Rate(count=len(theirs), total=len(top_planted)) if has_top else None,
                result=_centered(rate(ours, lambda r: r.won), rate(theirs, lambda r: r.won), has_top),
            )
        )
    top_no_plant = rate((r for r in ts if r.buy is not BuyType.ECO), lambda r: not r.planted)

    players = [p for p in squad_players if p.side is side]
    first_bloods = Counter(game_map.callout_at(p.first_blood_location) for p in players if p.first_blood and p.first_blood_location)
    first_deaths = Counter(d.callout for d in squad_deaths if d.side is side and d.opening)
    return MapSide(
        side=side,
        sites=sites,
        convert=_centered(
            rate((r for r in rs if r.first_kill is True), lambda r: r.won),
            rate((r for r in ts if r.first_kill is True), lambda r: r.won),
            has_top,
            DEFAULT_CONVERT_CENTER,
        ),
        recover=_centered(
            rate((r for r in rs if r.first_kill is False), lambda r: r.won),
            rate((r for r in ts if r.first_kill is False), lambda r: r.won),
            has_top,
            DEFAULT_RECOVER_CENTER,
        ),
        no_plant=rate((r for r in rs if r.buy is not BuyType.ECO), lambda r: not r.planted),
        top_no_plant=top_no_plant if has_top else None,
        duel_map=duel_map(game_map, side, players),
        first_death_spots=[
            FirstDeathSpot(callout=callout, first_deaths=n, first_bloods=first_bloods.get(callout, 0))
            for callout, n in first_deaths.most_common(MAX_SPOTS)
        ],
    )


def _compositions(
    map_name: str, player_matches: Sequence[PlayerMatchFact], top_player_matches: Sequence[PlayerMatchFact], has_top: bool
) -> MapCompositionsDetail:
    mine = compositions_by_map(player_matches, Cohort.SQUAD).get(map_name, [])
    top = compositions_by_map(top_player_matches, Cohort.TOP).get(map_name, []) if has_top else []
    top_comps = [
        TopComposition(
            agents=list(agents), share=Rate(count=n, total=len(top)), wins=Rate(count=sum(won for c, won in top if c == agents), total=n)
        )
        for agents, n in Counter(c for c, _ in top).most_common(MAX_COMPOSITIONS)
    ]
    # Agent presence is steadier than full compositions, which rarely repeat in solo queue.
    agents = [
        AgentPresence(
            agent=agent, presence=Rate(count=n, total=len(top)), wins=Rate(count=sum(won for c, won in top if agent in c), total=n)
        )
        for agent, n in Counter(a for c, _ in top for a in c).most_common(MAX_TOP_AGENTS)
    ]
    return MapCompositionsDetail(squad=count_compositions(mine, MAX_COMPOSITIONS), top=top_comps, top_agents=agents)


def _players(squad_players: Sequence[PlayerRoundFact]) -> list[MapPlayerRow]:
    rows = []
    for name, _ in Counter(p.name for p in squad_players).most_common():
        rs = [p for p in squad_players if p.name == name]
        acc = StatAccumulator(rs)
        rows.append(
            MapPlayerRow(
                name=name,
                main_agent=Counter(r.agent for r in rs).most_common(1)[0][0],
                matches=len({r.match_id for r in rs}),
                acs=acc.mean("acs"),
                kd=kill_death_ratio(rs),
                adr=acc.mean("adr"),
                kast=acc.mean("kast"),
                first_bloods=sum(r.first_blood for r in rs),
                first_deaths=sum(r.first_death for r in rs),
                impact=acc.mean("impact"),
            )
        )
    return rows
