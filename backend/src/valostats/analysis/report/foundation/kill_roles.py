"""Who a kill is about: the side and the role of the killer and of the victim.

Kill facts carry the victim's side only, and no agent: the role comes from the agent the player
played in that match (`ReportCohorts.agents`).
"""

from collections import defaultdict

from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohort, ReportCohorts
from valostats.domain.enums import Side
from valostats.domain.facts import KillFact


def killer_side(kill: KillFact) -> Side:
    """The killer plays the other side (teamkills are left out of the report cohorts)."""
    return kill.victim_side.opposite


def killer_role(cohorts: ReportCohorts, kill: KillFact) -> str:
    return cohorts.role_of_player(kill.match_id, kill.killer_puuid)


def victim_role(cohorts: ReportCohorts, kill: KillFact) -> str:
    return cohorts.role_of_player(kill.match_id, kill.victim_puuid)


def killer_agent(cohorts: ReportCohorts, kill: KillFact) -> str | None:
    return cohorts.agents.get((kill.match_id, kill.killer_puuid))


def group_by_role(cohorts: ReportCohorts, kind: FactKind, cohort: ReportCohort) -> dict[str, list[KillFact]]:
    """Kills of a cohort grouped by the role of the killer (KILLS) or of the victim (DEATHS).

    Grouping once is much faster than filtering the 270k top ranked kills by role for every cell.
    """
    role = killer_role if kind is FactKind.KILLS else victim_role
    groups: defaultdict[str, list[KillFact]] = defaultdict(list)
    for kill in cohorts.select(kind, cohort):
        groups[role(cohorts, kill)].append(kill)
    return dict(groups)
