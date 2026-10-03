"""Domain "Utilitaire": ability casts by player and agent, utility kills, team utility in won and lost matches.

Henrik gives no per-round casts (the round field is always empty): every figure comes from the match
totals (C = grenade, Q = ability 1, E = ability 2, X = ultimate) divided by the rounds of the match.
"""

from collections.abc import Callable, Sequence

from valostats.analysis.report.domains._lookups import KillsByRole, kill_bucket, measured_cell
from valostats.analysis.report.domains._players import player_art, role_label
from valostats.analysis.report.foundation.art import agent_art
from valostats.analysis.report.foundation.cells import Measure, Metric, cell, fixed, ratio
from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohort, ReportCohorts
from valostats.analysis.report.foundation.table_builder import TableBuilder
from valostats.constants.game import TEAM_SIZE
from valostats.constants.weapons import ABILITY_LABEL
from valostats.domain.facts import KillFact, PlayerMatchFact
from valostats.schemas.report.tables import StatTable, ValueFormat

Casts = Callable[[PlayerMatchFact], int]

# Casts per round are coloured from about 2 matches of rounds, ultimates from 2 matches.
MIN_CAST_ROUNDS = 40
MIN_ULT_MATCHES = 2
MIN_TEAM_MATCHES = 3


def _abilities(m: PlayerMatchFact) -> int:
    return m.grenade_casts + m.ability1_casts + m.ability2_casts


def _all_casts(m: PlayerMatchFact) -> int:
    return _abilities(m) + m.ultimate_casts


def _per_round(casts: Casts, team: bool = False) -> Metric:
    """Casts per round, the sample being the rounds played. A team counts each round once, not five times."""

    def measure(facts: Sequence[PlayerMatchFact]) -> Measure:
        rounds = sum(m.rounds for m in facts) / (TEAM_SIZE if team else 1)
        return (sum(casts(m) for m in facts) / rounds if rounds else None), round(rounds)

    return measure


def _per_match(casts: Casts, team: bool = False) -> Metric:
    def measure(facts: Sequence[PlayerMatchFact]) -> Measure:
        matches = len(facts) / (TEAM_SIZE if team else 1)
        return (sum(casts(m) for m in facts) / matches if matches else None), round(matches)

    return measure


def tables(cohorts: ReportCohorts) -> list[StatTable]:
    return [_by_player_agent(cohorts), _utility_kills(cohorts), _by_match_result(cohorts)]


def _by_player_agent(cohorts: ReportCohorts) -> StatTable:
    table = (
        TableBuilder("utility-agents", "Utilitaire par joueur et agent", "Joueur et agent", help="utilityPerRound")
        .column("c", "C par round", ValueFormat.DECIMAL_2, help="utilityPerRound", min=MIN_CAST_ROUNDS)
        .column("q", "Q par round", ValueFormat.DECIMAL_2, help="utilityPerRound", min=MIN_CAST_ROUNDS)
        .column("e", "E par round", ValueFormat.DECIMAL_2, help="utilityPerRound", min=MIN_CAST_ROUNDS)
        .column("x", "Ultimes par match", ValueFormat.DECIMAL_1, help="utilityUltPerMatch", min=MIN_ULT_MATCHES)
        .column("total", "Total par round", ValueFormat.DECIMAL_2, help="utilityTotalPerRound", min=MIN_CAST_ROUNDS)
    )
    metrics: dict[str, Metric] = {
        "c": _per_round(lambda m: m.grenade_casts),
        "q": _per_round(lambda m: m.ability1_casts),
        "e": _per_round(lambda m: m.ability2_casts),
        "x": _per_match(lambda m: m.ultimate_casts),
        "total": _per_round(_all_casts),
    }
    for player in cohorts.players():
        agents = sorted({m.agent for m in cohorts.squad(FactKind.PLAYER_MATCHES, name=player.name)})
        for agent in agents:
            # References: every top ranked and opposing player on the same agent; history: the player himself.
            is_player = _played_by(player.name)
            cells = {
                key: cell(cohorts, FactKind.PLAYER_MATCHES, metric, where=is_player, reference_where=_anyone, agent=agent)
                for key, metric in metrics.items()
            }
            table.row(f"{player.name}-{agent}", f"{player.name} · {agent}", cells, art=agent_art(agent), sub=agent)
    return table.build()


def _played_by(name: str) -> Callable[[PlayerMatchFact], bool]:
    return lambda m: m.name == name


def _anyone(_: PlayerMatchFact) -> bool:
    return True


def _is_utility_kill(kill: KillFact) -> bool:
    return kill_bucket(kill) == ABILITY_LABEL


def _utility_kills(cohorts: ReportCohorts) -> StatTable:
    table = (
        TableBuilder("utility-kills", "Kills à l'utilitaire par joueur", "Joueur", help="utilityKills")
        .count_column("count", "Kills à l'utilitaire", help="utilityKills")
        .column("share", "Part des kills", better=0, help="utilityKillShare")
    )
    by_role = KillsByRole(cohorts)
    for player in cohorts.players():
        kills = by_role.of_player(player)
        own = kills[ReportCohort.SQUAD]
        table.row(
            player.name,
            player.name,
            {
                "count": fixed(sum(1 for k in own if _is_utility_kill(k)), len(own)),
                "share": measured_cell(ratio(_is_utility_kill), kills),
            },
            art=player_art(player),
            sub=role_label(player),
        )
    return table.build()


def _by_match_result(cohorts: ReportCohorts) -> StatTable:
    table = (
        TableBuilder("utility-results", "Utilitaire de l'équipe selon le résultat du match", "Match", help="utilityTeamPerRound")
        .column("cqe", "Compétences par round", ValueFormat.DECIMAL_1, 0, help="utilityTeamPerRound")
        .column("x", "Ultimes par match", ValueFormat.DECIMAL_1, 0, help="utilityTeamUltPerMatch", min=MIN_TEAM_MATCHES)
    )
    for key, label, won in (("won", "Matchs gagnés", True), ("lost", "Matchs perdus", False)):
        table.row(
            key,
            label,
            {
                "cqe": cell(cohorts, FactKind.PLAYER_MATCHES, _per_round(_abilities, team=True), won=won),
                "x": cell(cohorts, FactKind.PLAYER_MATCHES, _per_match(lambda m: m.ultimate_casts, team=True), won=won),
            },
        )
    return table.build()
