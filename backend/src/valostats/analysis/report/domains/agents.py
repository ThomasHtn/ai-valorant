"""Domain "Agents et compos": agents played, agent pool, compositions, role splits, opponent agents, top ranked picks.

Team-level win rates in top ranked are close to 50 % by construction (both teams are sampled), so the
compositions are compared on their round win rate only where the same compo exists in top ranked.
"""

from collections import Counter, defaultdict
from collections.abc import Iterable, Sequence

from valostats.analysis.report.foundation.art import agent_art, map_art
from valostats.analysis.report.foundation.cells import Measure, Metric, cell, fixed, ratio
from valostats.analysis.report.foundation.cohort_cell import CohortMeasure, cohort_cell
from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohort, ReportCohorts
from valostats.analysis.report.foundation.kill_roles import killer_agent
from valostats.analysis.report.foundation.player_metrics import acs, kd, opening_duels_won, rounds_won
from valostats.analysis.report.foundation.table_builder import TableBuilder
from valostats.constants.agents import ROLE_LABELS, role_of
from valostats.constants.compositions import MIN_OPENING_DUELS, ROLE_ORDER, TOP_AGENTS
from valostats.constants.report import MIN_PLAYER_SAMPLE
from valostats.domain.enums import Reference
from valostats.domain.facts import MatchFact, PlayerMatchFact, RoundFact
from valostats.schemas.report.tables import StatCell, StatTable, ValueFormat


def tables(cohorts: ReportCohorts) -> list[StatTable]:
    return [
        _agents_played(cohorts),
        _agent_pool(cohorts),
        _compositions(cohorts),
        _top_compositions(cohorts),
        _role_splits(cohorts),
        _opponent_agents(cohorts),
        _top_presence(cohorts),
    ]


def record(matches: Sequence[MatchFact] | Sequence[PlayerMatchFact]) -> StatCell:
    """'12-15' with the number of matches as sample."""
    wins = sum(m.won for m in matches)
    return fixed(f"{wins}-{len(matches) - wins}", len(matches))


def compo(agents: Iterable[str]) -> str:
    return ", ".join(sorted(agents))


def role_split(agents: Iterable[str]) -> str:
    """Duelists-initiators-controllers-sentinels, e.g. '1-2-1-1'."""
    counts = Counter(role_of(a) for a in agents)
    return "-".join(str(counts[r]) for r in ROLE_ORDER)


def round_rate(matches: Sequence[MatchFact]) -> Measure:
    """Rounds won over rounds played in these team-matches."""
    rounds = sum(m.rounds for m in matches)
    return (sum(m.rounds_won for m in matches) / rounds if rounds else None), rounds


def _role_label(agent: str) -> str:
    role = role_of(agent)
    return ROLE_LABELS.get(role, role)


def _agents_played(cohorts: ReportCohorts) -> StatTable:
    table = (
        TableBuilder("agents-played", "Agents joués par l'escouade", "Agent", help="agentsPlayed")
        .count_column("matches", "Matchs")
        .record_column()
        .column("rw", "Rounds gagnés", help="agentRoundsWon")
        .column("acs", "ACS moyen", ValueFormat.INTEGER, help="acs")
        .column("players", "Joueurs", ValueFormat.TEXT, 0, ref=Reference.NONE, min=0)
    )
    played: Sequence[PlayerMatchFact] = cohorts.squad(FactKind.PLAYER_MATCHES)
    for agent in sorted({p.agent for p in played}):
        mine = [p for p in played if p.agent == agent]
        who = Counter(p.name for p in mine)
        table.row(
            agent,
            agent,
            {
                "matches": fixed(len(mine)),
                "wl": record(mine),
                "rw": cell(cohorts, FactKind.PLAYER_ROUNDS, rounds_won, agent=agent),
                "acs": cell(cohorts, FactKind.PLAYER_ROUNDS, acs, agent=agent),
                "players": fixed(", ".join(f"{n} ({c})" for n, c in sorted(who.items(), key=lambda x: (-x[1], x[0].lower()))), len(mine)),
            },
            art=agent_art(agent),
            sub=_role_label(agent),
        )
    return table.build()


def _agent_pool(cohorts: ReportCohorts) -> StatTable:
    table = (
        TableBuilder("agents-pool", "Agent pool par joueur", "Joueur · agent", help="agentPool")
        .count_column("matches", "Matchs")
        .record_column()
        .column("rw", "Rounds gagnés", help="agentRoundsWon", min=MIN_PLAYER_SAMPLE)
        .column("acs", "ACS", ValueFormat.INTEGER, help="acs", min=MIN_PLAYER_SAMPLE)
        .column("kd", "K/D", ValueFormat.DECIMAL_2, help="kd", min=MIN_PLAYER_SAMPLE)
        .column("fbfd", "FB-FD", ValueFormat.TEXT, 0, help="fbfd", ref=Reference.NONE, min=0)
        .column("open", "Duels d'ouverture gagnés", help="openingWon", min=MIN_OPENING_DUELS)
    )
    played: Sequence[PlayerMatchFact] = cohorts.squad(FactKind.PLAYER_MATCHES)
    for player in cohorts.players():
        agents = Counter(p.agent for p in played if p.name == player.name)
        for agent, _ in sorted(agents.items(), key=lambda x: (-x[1], x[0])):
            matches = [p for p in played if p.name == player.name and p.agent == agent]
            rows = [r for r in cohorts.squad(FactKind.PLAYER_ROUNDS, agent=agent) if r.name == player.name]

            table.row(
                f"{player.name}-{agent}",
                f"{player.name} · {agent}",
                {
                    "matches": fixed(len(matches)),
                    "wl": record(matches),
                    "rw": _on_agent(cohorts, rounds_won, player.name, agent),
                    "acs": _on_agent(cohorts, acs, player.name, agent),
                    "kd": _on_agent(cohorts, kd, player.name, agent),
                    "fbfd": fixed(f"{sum(r.first_blood for r in rows)}-{sum(r.first_death for r in rows)}", len(rows)),
                    "open": _on_agent(cohorts, opening_duels_won, player.name, agent),
                },
                art=agent_art(agent),
            )
    return table.build()


def _on_agent(cohorts: ReportCohorts, metric: Metric, name: str, agent: str) -> StatCell:
    """A player on one agent, against every player of that agent (top, opp) and his own history on it."""
    return cell(
        cohorts,
        FactKind.PLAYER_ROUNDS,
        metric,
        where=lambda r: r.name == name,
        reference_where=lambda r: True,
        agent=agent,
    )


def _matches_by(cohorts: ReportCohorts, cohort: ReportCohort, map_name: str, key: str) -> dict[str, list[MatchFact]]:
    """Team-matches of a cohort on a map grouped by compo ("compo") or role split ("roles")."""
    group = compo if key == "compo" else role_split
    out: defaultdict[str, list[MatchFact]] = defaultdict(list)
    for match in cohorts.select(FactKind.MATCHES, cohort, map_name=map_name):
        out[group(match.agents)].append(match)
    return out


def _compositions(cohorts: ReportCohorts) -> StatTable:
    table = (
        TableBuilder("agents-compos", "Compos par carte", "Carte · compo", help="compos")
        .count_column("matches", "Matchs")
        .record_column()
        .column("rw", "Rounds gagnés", help="compoRoundsWon")
    )
    for map_name in cohorts.maps():
        by_cohort = {c: _matches_by(cohorts, c, map_name, "compo") for c in ReportCohort}
        squad = by_cohort[ReportCohort.SQUAD]
        for key, matches in sorted(squad.items(), key=lambda x: (-len(x[1]), x[0])):
            # The same compo in top ranked and in the squad's history; opponents never play our compo.
            rate = cohort_cell(_compo_rate(by_cohort, key), (ReportCohort.TOP, ReportCohort.HISTORY))
            table.row(
                f"{map_name}-{key}",
                map_name,
                {"matches": fixed(len(matches)), "wl": record(matches), "rw": rate},
                art=map_art(map_name),
                agents=sorted(matches[0].agents),
            )
    return table.build()


def _compo_rate(by_cohort: dict[ReportCohort, dict[str, list[MatchFact]]], key: str) -> CohortMeasure:
    return lambda cohort: round_rate(by_cohort[cohort].get(key, []))


def _top_compositions(cohorts: ReportCohorts) -> StatTable:
    table = (
        TableBuilder("agents-top-compos", "Compo la plus jouée en top ranked", "Carte · compo", help="topCompo")
        .count_column("matches", "Matchs top ranked")
        .column("share", "Part des équipes", better=0, help="topCompo", ref=Reference.NONE, min=0)
        .column("rw", "Rounds gagnés", better=0, help="topCompo", ref=Reference.NONE, min=0)
        .count_column("squad", "Jouée par l'escouade")
    )
    for map_name in cohorts.maps():
        top = _matches_by(cohorts, ReportCohort.TOP, map_name, "compo")
        if not top:
            continue
        key, matches = max(top.items(), key=lambda x: (len(x[1]), x[0]))
        total = sum(len(v) for v in top.values())
        value, rounds = round_rate(matches)
        played = len(_matches_by(cohorts, ReportCohort.SQUAD, map_name, "compo").get(key, []))
        table.row(
            map_name,
            map_name,
            {
                "matches": fixed(len(matches)),
                "share": fixed(len(matches) / total, total),
                "rw": fixed(value, rounds),
                "squad": fixed(played),
            },
            art=map_art(map_name),
            agents=sorted(matches[0].agents),
        )
    return table.build()


def _role_splits(cohorts: ReportCohorts) -> StatTable:
    table = (
        TableBuilder("agents-roles", "Rôles par compo", "Carte", help="roleSplit")
        .column("squad", "Escouade", ValueFormat.TEXT, 0, ref=Reference.NONE, min=0)
        .count_column("squadN", "Matchs avec")
        .column("rw", "Rounds gagnés avec", help="roleSplit", ref=Reference.NONE)
        .column("top", "Top ranked", ValueFormat.TEXT, 0, ref=Reference.NONE, min=0)
        .column("topShare", "Part en top ranked", better=0, help="roleSplit", ref=Reference.NONE, min=0)
        .column("topRw", "Rounds gagnés en top ranked", better=0, help="roleSplit", ref=Reference.NONE, min=0)
    )
    for map_name in cohorts.maps():
        squad = _matches_by(cohorts, ReportCohort.SQUAD, map_name, "roles")
        top = _matches_by(cohorts, ReportCohort.TOP, map_name, "roles")
        squad_key, squad_matches = max(squad.items(), key=lambda x: (len(x[1]), x[0]))
        others = ", ".join(f"{k} ({len(v)})" for k, v in sorted(squad.items(), key=lambda x: -len(x[1])) if k != squad_key)
        cells = {
            "squad": fixed(squad_key, len(squad_matches)),
            "squadN": fixed(len(squad_matches)),
            "rw": fixed(*round_rate(squad_matches)),
        }
        if top:
            top_key, top_matches = max(top.items(), key=lambda x: (len(x[1]), x[0]))
            total = sum(len(v) for v in top.values())
            cells |= {
                "top": fixed(top_key, len(top_matches)),
                "topShare": fixed(len(top_matches) / total, total),
                "topRw": fixed(*round_rate(top_matches)),
            }
        table.row(map_name, map_name, cells, art=map_art(map_name), sub=f"autres : {others}" if others else None)
    return table.build()


def _opponent_agents(cohorts: ReportCohorts) -> StatTable:
    table = (
        TableBuilder("agents-opponents", "Agents adverses", "Agent adverse", help="oppAgents")
        .count_column("matches", "Matchs face à lui")
        .column("rw", "Rounds gagnés contre lui", help="oppAgentRoundsWon", ref=Reference.HISTORY)
        .column("kpr", "Kills sur l'escouade par round", ValueFormat.DECIMAL_2, -1, help="oppAgentKpr")
    )
    faced = {
        (m.match_id, m.team_id): set(m.opp_agents)
        for c in (ReportCohort.SQUAD, ReportCohort.HISTORY, ReportCohort.TOP)
        for m in cohorts.select(FactKind.MATCHES, c)
    }
    squad_matches: Sequence[MatchFact] = cohorts.squad(FactKind.MATCHES)
    # Top reference of the kill rate: the agent's own kills per round played, all top games.
    top_rounds = Counter(r.agent for r in cohorts.select(FactKind.PLAYER_ROUNDS, ReportCohort.TOP))
    top_kills = Counter(killer_agent(cohorts, k) for k in cohorts.select(FactKind.KILLS, ReportCohort.TOP))
    for agent in sorted({a for m in squad_matches for a in m.opp_agents}):

        def against(r: RoundFact, a: str = agent) -> bool:
            return a in faced.get((r.match_id, r.team_id), ())

        def kills_per_round(cohort: ReportCohort, a: str = agent) -> Measure:
            if cohort is ReportCohort.TOP:
                rounds = top_rounds[a]
                return (top_kills[a] / rounds if rounds else None), rounds
            rounds = sum(1 for r in cohorts.select(FactKind.ROUNDS, cohort) if against(r, a))
            kills = sum(1 for k in cohorts.select(FactKind.DEATHS, cohort) if killer_agent(cohorts, k) == a)
            return (kills / rounds if rounds else None), rounds

        table.row(
            agent,
            agent,
            {
                "matches": fixed(sum(1 for m in squad_matches if agent in m.opp_agents)),
                "rw": cell(
                    cohorts, FactKind.ROUNDS, ratio(lambda r: r.won), where=against, references=(ReportCohort.TOP, ReportCohort.HISTORY)
                ),
                "kpr": cohort_cell(kills_per_round, (ReportCohort.TOP, ReportCohort.HISTORY)),
            },
            art=agent_art(agent),
            sub=_role_label(agent),
        )
    return table.build()


def _top_presence(cohorts: ReportCohorts) -> StatTable:
    table = TableBuilder("agents-top-presence", "Agents les plus joués en top ranked", "Carte", help="topPresence")
    for i in range(1, TOP_AGENTS + 1):
        table.column(f"a{i}", f"Agent {i}", ValueFormat.TEXT, 0, ref=Reference.NONE, min=0)
    table.count_column("played", "Joués par l'escouade", help="topPresence")
    for map_name in cohorts.maps():
        top: Sequence[MatchFact] = cohorts.select(FactKind.MATCHES, ReportCohort.TOP, map_name=map_name)
        if not top:
            continue
        picks = Counter(a for m in top for a in set(m.agents)).most_common(TOP_AGENTS)
        ours = {a for m in cohorts.squad(FactKind.MATCHES, map_name=map_name) for a in m.agents}
        cells = {f"a{i}": fixed(f"{agent} {round(100 * n / len(top))} %", len(top)) for i, (agent, n) in enumerate(picks, start=1)}
        cells["played"] = fixed(sum(1 for agent, _ in picks if agent in ours))
        table.row(map_name, map_name, cells, art=map_art(map_name))
    return table.build()
