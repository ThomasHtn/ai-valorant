"""Lookups and fast reference cells shared by the Spike, Économie, Armes, Utilitaire and Timings domains.

The top ranked cohort holds about 270k kills and 370k player-rounds. Filtering it with a Python
predicate for every cell would take seconds per table, so these helpers either use the cohort
indexes (`select(..., agent=...)`) or build a dictionary once per `tables()` call, then answer each
cell with dictionary lookups.
"""

from collections import defaultdict
from collections.abc import Iterator, Mapping, Sequence
from typing import Any

from valostats.analysis.report.foundation.cells import Metric, rounded
from valostats.analysis.report.foundation.cohorts import REFERENCE_COHORTS, FactKind, ReportCohort, ReportCohorts, SquadPlayer
from valostats.constants.agents import AGENT_ROLES
from valostats.constants.weapons import ABILITY_LABEL, KNIFE_LABEL, OTHER_LABEL
from valostats.domain.enums import KillMeans
from valostats.domain.facts import KillFact, PlayerRoundFact, RoundFact
from valostats.schemas.report.tables import CellValue, StatCell

# Facts of every reference cohort, keyed like `StatCell` fields.
CohortFacts = Mapping[ReportCohort, Sequence[Any]]


def cell_from_measures(measures: Mapping[ReportCohort, tuple[CellValue, int]]) -> StatCell:
    """A cell from values already computed per cohort; a reference with an empty sample is left out (None)."""
    value, sample = measures.get(ReportCohort.SQUAD, (None, 0))
    out: dict[str, CellValue | int] = {"v": rounded(value), "n": sample}
    for cohort in REFERENCE_COHORTS:
        if cohort not in measures:
            continue
        ref_value, ref_sample = measures[cohort]
        out[cohort.value] = rounded(ref_value) if ref_sample else None
        out[f"{cohort.value}_n"] = ref_sample
    return StatCell.model_validate(out)


def measured_cell(metric: Metric, facts: CohortFacts) -> StatCell:
    """A cell from facts already split by cohort: squad value plus each reference present in `facts`."""
    return cell_from_measures({cohort: metric(cohort_facts) for cohort, cohort_facts in facts.items()})


def every_fact(cohorts: ReportCohorts, kind: FactKind) -> Iterator[Any]:
    """Facts of a kind in all four cohorts (squad, opp, hist and top never overlap)."""
    for cohort in ReportCohort:
        yield from cohorts.select(kind, cohort)


# ---- player rows compared with players of the same role ----


def role_agents(role: str) -> tuple[str, ...]:
    return tuple(agent for agent, agent_role in AGENT_ROLES.items() if agent_role == role)


def role_facts(cohorts: ReportCohorts, kind: FactKind, cohort: ReportCohort, role: str, **equal: Any) -> list[Any]:
    """Facts with an `agent` field played on an agent of `role`, read through the agent index."""
    return [f for agent in role_agents(role) for f in cohorts.select(kind, cohort, agent=agent, **equal)]


def player_facts(cohorts: ReportCohorts, kind: FactKind, player: SquadPlayer, **equal: Any) -> dict[ReportCohort, Sequence[Any]]:
    """A player's facts (squad, hist) and the facts of his role (top, opp), for facts with `name` and `agent`."""
    return {
        ReportCohort.SQUAD: cohorts.select(kind, ReportCohort.SQUAD, name=player.name, **equal),
        ReportCohort.HISTORY: cohorts.select(kind, ReportCohort.HISTORY, name=player.name, **equal),
        ReportCohort.TOP: role_facts(cohorts, kind, ReportCohort.TOP, player.role, **equal),
        ReportCohort.OPPONENTS: role_facts(cohorts, kind, ReportCohort.OPPONENTS, player.role, **equal),
    }


def player_role_cell(cohorts: ReportCohorts, kind: FactKind, metric: Metric, player: SquadPlayer, **equal: Any) -> StatCell:
    """Same contract as `cells.player_cell`, fast on the top ranked player-rounds."""
    return measured_cell(metric, player_facts(cohorts, kind, player, **equal))


class KillsByRole:
    """Kills of every cohort grouped by the killer's role, then a player's kills against those of his role."""

    def __init__(self, cohorts: ReportCohorts) -> None:
        self._by_role: dict[ReportCohort, dict[str, list[KillFact]]] = {}
        for cohort in ReportCohort:
            groups: dict[str, list[KillFact]] = defaultdict(list)
            for kill in cohorts.select(FactKind.KILLS, cohort):
                groups[cohorts.role_of_player(kill.match_id, kill.killer_puuid)].append(kill)
            self._by_role[cohort] = dict(groups)
        self._cohorts = cohorts

        self._by_bucket: dict[tuple[ReportCohort, str], dict[str, list[KillFact]]] = {}

    def of_player(self, player: SquadPlayer) -> dict[ReportCohort, Sequence[KillFact]]:
        return {
            ReportCohort.SQUAD: self._cohorts.select(FactKind.KILLS, ReportCohort.SQUAD, killer=player.name),
            ReportCohort.HISTORY: self._cohorts.select(FactKind.KILLS, ReportCohort.HISTORY, killer=player.name),
            ReportCohort.TOP: self._by_role[ReportCohort.TOP].get(player.role, []),
            ReportCohort.OPPONENTS: self._by_role[ReportCohort.OPPONENTS].get(player.role, []),
        }

    def of_player_with(self, player: SquadPlayer, bucket: str) -> dict[ReportCohort, Sequence[KillFact]]:
        """Like `of_player`, limited to the kills of one weapon bucket (see `kill_bucket`)."""
        out: dict[ReportCohort, Sequence[KillFact]] = {}
        for cohort, kills in self.of_player(player).items():
            if cohort in (ReportCohort.TOP, ReportCohort.OPPONENTS):
                key = (cohort, player.role)
                if key not in self._by_bucket:
                    grouped: dict[str, list[KillFact]] = defaultdict(list)
                    for kill in kills:
                        grouped[kill_bucket(kill)].append(kill)
                    self._by_bucket[key] = dict(grouped)
                out[cohort] = self._by_bucket[key].get(bucket, [])
            else:
                out[cohort] = [k for k in kills if kill_bucket(k) == bucket]
        return out


# ---- kills ----


def kill_bucket(kill: KillFact) -> str:
    """Weapon name of a gun kill, or the bucket of the other kills (abilities, knife, other)."""
    if kill.means is KillMeans.ABILITY or (kill.means is KillMeans.WEAPON and kill.weapon is None):
        return ABILITY_LABEL
    if kill.means is KillMeans.MELEE:
        return KNIFE_LABEL
    if kill.means is KillMeans.WEAPON and kill.weapon:
        return kill.weapon
    return OTHER_LABEL


def kill_times_by_round(cohorts: ReportCohorts) -> dict[tuple[str, int], list[int]]:
    """Sorted kill times of every round. Kills are read by victim and by killer so no team's kill is missed."""
    times: dict[tuple[str, int], set[tuple[int, str]]] = defaultdict(set)
    for kind in (FactKind.DEATHS, FactKind.KILLS):
        for kill in every_fact(cohorts, kind):
            times[(kill.match_id, kill.round_index)].add((kill.ms, kill.victim_puuid))
    return {key: sorted(ms for ms, _ in kills) for key, kills in times.items()}


# ---- rounds seen from a player ----


class TeamRounds:
    """The team round of a player-round, to read the team's buy, loadout or plant from a player's row."""

    def __init__(self, cohorts: ReportCohorts) -> None:
        self._team_of = {(p.match_id, p.puuid): p.team_id for p in every_fact(cohorts, FactKind.PLAYER_MATCHES)}
        self._rounds = {(r.match_id, r.round_index, r.team_id): r for r in every_fact(cohorts, FactKind.ROUNDS)}

    def of(self, player_round: PlayerRoundFact) -> RoundFact | None:
        team = self._team_of.get((player_round.match_id, player_round.puuid))
        return self._rounds.get((player_round.match_id, player_round.round_index, team or ""))


def planters(cohorts: ReportCohorts) -> set[tuple[str, int, str]]:
    """(match, round, planter name) of every plant, to know whether a player planted in a round."""
    return {(r.match_id, r.round_index, r.planter) for r in every_fact(cohorts, FactKind.ROUNDS) if r.planter}
