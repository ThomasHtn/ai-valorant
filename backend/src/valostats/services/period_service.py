"""Period report: picks the facts of the period and of the comparison period, then runs every analysis."""

import threading
from collections import Counter, OrderedDict
from dataclasses import dataclass
from functools import cached_property

from valostats.analysis.insights.compositions import compositions
from valostats.analysis.insights.correlations import correlations
from valostats.analysis.insights.revenge_matrix import revenge_matrix
from valostats.analysis.insights.round_drivers import round_drivers
from valostats.analysis.insights.sessions_context import sessions_context
from valostats.analysis.maps.map_sheet import map_sheet
from valostats.analysis.period import findings as findings_analysis
from valostats.analysis.period.evolution import evolution
from valostats.analysis.period.recurring_spots import recurring_spots
from valostats.analysis.period.selection import PeriodQuery, PeriodWindow, patch_sort_key, resolve, whole_history_before
from valostats.analysis.period.summary import summary
from valostats.analysis.players.profile import player_profile
from valostats.analysis.players.roster import roster
from valostats.analysis.session.grouping import session_days
from valostats.analysis.team.clutches import clutches
from valostats.analysis.team.economy import economy
from valostats.analysis.team.kpis import team_kpis
from valostats.analysis.team.map_pool import map_pool
from valostats.analysis.team.match_results import match_links, opponents_only, squad_only
from valostats.analysis.team.opening import opening
from valostats.analysis.team.sites import sites
from valostats.analysis.team.situations import situations
from valostats.constants.analysis import MIN_PLAYER_ROUNDS, MIN_PREVIOUS_MATCHES
from valostats.core.errors import NotFoundError
from valostats.domain.facts import DeathFact, PlayerMatchFact, PlayerRoundFact, RoundFact
from valostats.schemas.common import MatchLink
from valostats.schemas.period.map_sheet import MapSheet
from valostats.schemas.period.player import PlayerProfile
from valostats.schemas.period.report import AvailablePeriods, PeriodOverview, PlayerLink, TeamReport
from valostats.services.facts_store import FactsStore, SquadFacts, TopFacts

# Period computations kept in memory (each one is a few megabytes).
CACHED_PERIODS = 8


@dataclass
class PeriodData:
    """Facts of a period (squad and opponents) and of its comparison period. Deaths exclude teamkills."""

    window: PeriodWindow
    comparison_label: str
    rounds: list[RoundFact]
    deaths: list[DeathFact]
    player_rounds: list[PlayerRoundFact]
    player_matches: list[PlayerMatchFact]
    previous_rounds: list[RoundFact]
    previous_deaths: list[DeathFact]
    previous_player_rounds: list[PlayerRoundFact]
    top: TopFacts
    # Squad matches of the period with their evening, oldest first.
    matches: dict[str, MatchLink]

    @cached_property
    def findings(self) -> findings_analysis.FindingSet:
        return findings_analysis.find_gaps(self.rounds, self.deaths, self.top.rounds, [d for d in self.top.deaths if not d.teamkill])

    @cached_property
    def profiled_players(self) -> list[PlayerLink]:
        """Players with enough rounds for a profile, most rounds first."""
        squad_rounds = squad_only(self.player_rounds)
        rounds = Counter(r.puuid for r in squad_rounds)
        names = {r.puuid: r.name for r in squad_rounds}
        agents = Counter((r.puuid, r.agent) for r in squad_rounds)
        main_agent: dict[str, str] = {}
        for (puuid, agent), _ in agents.most_common():
            main_agent.setdefault(puuid, agent)
        return [PlayerLink(puuid=p, name=names[p], main_agent=main_agent[p]) for p, n in rounds.most_common() if n >= MIN_PLAYER_ROUNDS]


def build_period_data(query: PeriodQuery, squad: SquadFacts, top: TopFacts) -> PeriodData:
    squad_rounds = squad_only(squad.rounds)
    if not squad_rounds:
        raise NotFoundError("No squad match in the database.")
    window = resolve(query, [r.started_at for r in squad_rounds], [r.patch for r in squad_rounds])
    deaths = [d for d in squad.deaths if not d.teamkill]
    rounds = [r for r in squad.rounds if window.includes(r)]
    if not rounds:
        raise NotFoundError(f"No squad match in period {window.title}.")
    previous, label = window.previous, window.comparison_label
    if len({r.match_id for r in squad_rounds if previous(r)}) < MIN_PREVIOUS_MATCHES:
        previous, label = whole_history_before(min(r.started_at for r in rounds))
    return PeriodData(
        window=window,
        comparison_label=label,
        rounds=rounds,
        deaths=[d for d in deaths if window.includes(d)],
        player_rounds=[r for r in squad.player_rounds if window.includes(r)],
        player_matches=[m for m in squad.player_matches if window.includes(m)],
        previous_rounds=[r for r in squad.rounds if previous(r)],
        previous_deaths=[d for d in deaths if previous(d)],
        previous_player_rounds=[r for r in squad.player_rounds if previous(r)],
        top=top,
        # Evenings are grouped over every squad match, so one crossing the period's edge keeps its day.
        matches=match_links(rounds, session_days(squad.rounds)),
    )


class PeriodService:
    def __init__(self, store: FactsStore) -> None:
        self._store = store
        self._cache: OrderedDict[tuple[str, int, int], PeriodData] = OrderedDict()
        # Requests run in a thread pool: one period is computed once, not once per concurrent request.
        self._lock = threading.Lock()

    def available(self) -> AvailablePeriods:
        rounds = squad_only(self._store.squad().rounds)
        dates = [r.started_at for r in rounds]
        return AvailablePeriods(
            months=sorted({f"{d:%Y-%m}" for d in dates}, reverse=True),
            patches=sorted({r.patch for r in rounds}, key=patch_sort_key, reverse=True),
            first_day=min(dates).date() if dates else None,
            last_day=max(dates).date() if dates else None,
        )

    def overview(self, query: PeriodQuery) -> PeriodOverview:
        data = self._data(query)
        squad_rounds = squad_only(data.rounds)
        return PeriodOverview(
            key=data.window.key,
            title=data.window.title,
            comparison_label=data.comparison_label,
            matches=len({r.match_id for r in squad_rounds}),
            top_reference_matches=data.top.matches,
            maps=[m for m, _ in Counter(r.map_name for r in squad_rounds).most_common()],
            players=data.profiled_players,
        )

    def team(self, query: PeriodQuery) -> TeamReport:
        d = self._data(query)
        top = d.top
        return TeamReport(
            summary=summary(d.findings, d.deaths, d.matches),
            kpis=team_kpis(d.comparison_label, d.rounds, d.player_rounds, d.previous_rounds, d.previous_player_rounds),
            matches=list(reversed(d.matches.values())),
            map_pool=map_pool(d.rounds),
            findings=findings_analysis.team_findings(d.findings, d.matches),
            round_drivers=round_drivers(d.rounds, d.deaths, top.rounds, top.deaths),
            correlations=correlations(d.rounds, d.deaths, d.player_rounds, d.player_matches),
            economy=economy(d.rounds, top.rounds),
            opening=opening(d.rounds, d.player_rounds, top.rounds, self._store.maps()),
            situations=situations(d.rounds, top.rounds),
            sites=sites(d.rounds, top.rounds),
            clutches=clutches(d.player_rounds, top.player_rounds),
            revenge=revenge_matrix(d.deaths),
            compositions=compositions(d.player_matches, top.player_matches),
            sessions_context=sessions_context(d.rounds, d.player_rounds),
            recurring_spots=recurring_spots(d.deaths),
            roster=roster(squad_only(d.player_rounds), {p.puuid for p in d.profiled_players}),
            evolution=evolution(d.comparison_label, d.rounds, d.deaths, d.previous_rounds, d.previous_deaths),
        )

    def map_sheet(self, query: PeriodQuery, map_name: str) -> MapSheet:
        d = self._data(query)
        game_map = self._store.maps().get(map_name)
        if game_map is None or not any(r.map_name == map_name for r in squad_only(d.rounds)):
            raise NotFoundError(f"No squad match on {map_name} in {d.window.title}.")
        return map_sheet(
            game_map,
            d.rounds,
            d.deaths,
            d.player_rounds,
            d.player_matches,
            d.top.rounds,
            d.top.player_matches,
            findings_analysis.map_findings(d.findings, map_name, d.matches),
        )

    def player(self, query: PeriodQuery, puuid: str) -> PlayerProfile:
        d = self._data(query)
        if puuid not in {p.puuid for p in d.profiled_players}:
            raise NotFoundError(f"No profile for player {puuid} in {d.window.title}.")
        return player_profile(
            puuid=puuid,
            comparison_label=d.comparison_label,
            rows=[r for r in squad_only(d.player_rounds) if r.puuid == puuid],
            opponent_rows=opponents_only(d.player_rounds),
            previous_rows=[r for r in squad_only(d.previous_player_rounds) if r.puuid == puuid],
            player_matches=[m for m in squad_only(d.player_matches) if m.puuid == puuid],
            top_by_agent=d.top.by_agent,
            top_player_matches=d.top.player_matches,
            top_weapons=d.top.weapons,
            maps=self._store.maps(),
        )

    def _data(self, query: PeriodQuery) -> PeriodData:
        squad, top = self._store.squad(), self._store.top()
        key = (query.key, squad.version, top.version)
        with self._lock:
            if key not in self._cache:
                self._cache[key] = build_period_data(query, squad, top)
                if len(self._cache) > CACHED_PERIODS:
                    self._cache.popitem(last=False)
            self._cache.move_to_end(key)
            return self._cache[key]
