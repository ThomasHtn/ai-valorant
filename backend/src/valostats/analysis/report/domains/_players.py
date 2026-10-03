"""Shared pieces of the per-player tables: row picture and label, and cells compared with the player's role.

A player cell compares the player with players of his main role (top ranked and opponents) and with
himself before the period. `cells.player_cell` filters every reference fact for each cell, which is
too slow on the 370k top ranked player-rounds when a table has dozens of player cells. `PlayerFacts`
slices each cohort by player name and by role once, then every cell is a few dictionary lookups.

It works on player-rounds and player-matches (the player is `name`, his role comes from `agent`) and
on kill facts (the player is the victim for DEATHS, the killer for KILLS; his role comes from the
agent he played in that match).
"""

from collections import defaultdict
from collections.abc import Callable, Sequence
from typing import Any

from valostats.analysis.report.foundation.art import agent_art
from valostats.analysis.report.foundation.cells import Metric, rounded
from valostats.analysis.report.foundation.cohorts import REFERENCE_COHORTS, FactKind, ReportCohort, ReportCohorts, SquadPlayer
from valostats.constants.agents import ROLE_LABELS, role_of
from valostats.schemas.report.tables import GameArt, StatCell

_Slices = tuple[dict[str, list[Any]], dict[str, list[Any]]]


def player_art(player: SquadPlayer) -> GameArt:
    """Rows of players show the portrait of their main agent."""
    return agent_art(player.main_agent)


def role_label(player: SquadPlayer) -> str:
    return ROLE_LABELS.get(player.role, player.role)


class PlayerFacts:
    """Facts of a report sliced by player and by role, built lazily once per (kind, cohort)."""

    def __init__(self, cohorts: ReportCohorts) -> None:
        self._cohorts = cohorts
        self._slices: dict[tuple[FactKind, ReportCohort], _Slices] = {}
        # Role references are shared by the players of a role: measured once per metric. The entry keeps
        # the metric and filter alive so their ids cannot be reused by another function.
        self._role_measures: dict[tuple[Any, ...], tuple[Metric, Any, tuple[float | None, int]]] = {}

    def of_player(self, kind: FactKind, cohort: ReportCohort, name: str) -> list[Any]:
        return self._sliced(kind, cohort)[0].get(name, [])

    def of_role(self, kind: FactKind, cohort: ReportCohort, role: str) -> list[Any]:
        return self._sliced(kind, cohort)[1].get(role, [])

    def cell(self, kind: FactKind, metric: Metric, player: SquadPlayer, among: Callable[[Any], bool] | None = None) -> StatCell:
        """The metric on the player's facts, on his role's facts (top, opp) and on his own history.

        `among` narrows every group the same way (e.g. opening kills only).
        """

        def measure(facts: Sequence[Any]) -> tuple[float | None, int]:
            return metric(facts if among is None else [f for f in facts if among(f)])

        value, sample = measure(self.of_player(kind, ReportCohort.SQUAD, player.name))
        out: dict[str, Any] = {"v": rounded(value), "n": sample}
        for cohort in REFERENCE_COHORTS:
            if cohort is ReportCohort.HISTORY:
                ref, ref_n = measure(self.of_player(kind, cohort, player.name))
            else:
                key = (kind, cohort, player.role, id(metric), id(among))
                if key not in self._role_measures:
                    self._role_measures[key] = (metric, among, measure(self.of_role(kind, cohort, player.role)))
                ref, ref_n = self._role_measures[key][2]
            out[cohort.value] = rounded(ref) if ref_n else None
            out[f"{cohort.value}_n"] = ref_n
        return StatCell.model_validate(out)

    def _sliced(self, kind: FactKind, cohort: ReportCohort) -> _Slices:
        key = (kind, cohort)
        if key not in self._slices:
            by_name: defaultdict[str, list[Any]] = defaultdict(list)
            by_role: defaultdict[str, list[Any]] = defaultdict(list)
            for fact in self._cohorts.select(kind, cohort):
                name, role = self._identity(kind, fact)
                by_name[name].append(fact)
                by_role[role].append(fact)
            self._slices[key] = (dict(by_name), dict(by_role))
        return self._slices[key]

    def _identity(self, kind: FactKind, fact: Any) -> tuple[str, str]:
        """Name and role of the player a fact is about."""
        if kind is FactKind.DEATHS:
            return fact.victim, self._cohorts.role_of_player(fact.match_id, fact.victim_puuid)
        if kind is FactKind.KILLS:
            return fact.killer, self._cohorts.role_of_player(fact.match_id, fact.killer_puuid)
        return fact.name, role_of(fact.agent)
