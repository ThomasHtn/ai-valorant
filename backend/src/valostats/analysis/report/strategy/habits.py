"""Habits that separate the top ranked from the squad, each priced in rounds per match.

A habit is a yes/no condition on a population (first deaths, attack rounds, plants...). The top
ranked tell what it is worth: their round win rate with it and without it. The squad's cost is then
(squad share - top share) x (worth) x squad population per match.
"""

from collections.abc import Callable, Sequence
from dataclasses import dataclass
from typing import Any

from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohort, ReportCohorts
from valostats.constants.strategy import CLOSE_TEAMMATE_UNITS, EARLY_PLANT_MS
from valostats.domain.enums import Cohort, Side
from valostats.domain.facts import KillFact, RoundFact
from valostats.schemas.common import Rate
from valostats.schemas.report.strategy import Habit

Test = Callable[[Any], bool]
# Round result of a team, to tell what a kill fact led to.
RoundWon = dict[tuple[str, int, str], bool]


@dataclass(frozen=True)
class HabitRule:
    key: str
    label: str
    detail: str
    kind: FactKind
    among: Test
    condition: Test
    # Round won by the team the fact belongs to; `RoundWon` resolves kill facts.
    won: Callable[[Any, RoundWon], bool]


def _round_won(r: RoundFact, _: RoundWon) -> bool:
    return r.won


def _victim_team_won(k: KillFact, rounds: RoundWon) -> bool:
    return rounds.get((k.match_id, k.round_index, k.victim_team), False)


HABITS: tuple[HabitRule, ...] = (
    HabitRule(
        "trade",
        "Première mort tradée",
        "premières morts vengées par un coéquipier",
        FactKind.ROUNDS,
        lambda r: r.first_kill is False,
        lambda r: r.first_death_avenged is True,
        _round_won,
    ),
    HabitRule(
        "spacing",
        "Coéquipier à moins de 10 m à la première mort",
        "premières morts avec un coéquipier à moins de 10 m",
        FactKind.DEATHS,
        lambda k: k.opening and k.nearest_teammate is not None,
        lambda k: k.nearest_teammate <= CLOSE_TEAMMATE_UNITS,
        _victim_team_won,
    ),
    HabitRule(
        "zero-damage",
        "Morts sans dégâts",
        "morts avant d'avoir touché un adversaire",
        FactKind.DEATHS,
        lambda k: True,
        lambda k: k.victim_damage == 0,
        _victim_team_won,
    ),
    HabitRule(
        "planted",
        "Spike posé en attaque",
        "rounds d'attaque avec le spike posé",
        FactKind.ROUNDS,
        lambda r: r.side is Side.ATTACK,
        lambda r: r.planted,
        _round_won,
    ),
    HabitRule(
        "early-plant",
        "Spike posé avant 1:00",
        "poses dans la première minute du round",
        FactKind.ROUNDS,
        lambda r: r.side is Side.ATTACK and r.plant_ms is not None,
        lambda r: r.plant_ms <= EARLY_PLANT_MS,
        _round_won,
    ),
    HabitRule(
        "plant-advantage",
        "Pose en supériorité numérique",
        "poses avec plus de joueurs vivants que l'adversaire",
        FactKind.ROUNDS,
        lambda r: r.side is Side.ATTACK and r.advantage_at_plant is not None,
        lambda r: r.advantage_at_plant > 0,
        _round_won,
    ),
)


def habits(cohorts: ReportCohorts, map_name: str, squad_matches: int) -> list[Habit]:
    """Every habit on one map, the costliest for the squad first."""
    rounds = {c: _round_results(cohorts, c, map_name) for c in (ReportCohort.SQUAD, ReportCohort.TOP)}
    lines = [_habit(cohorts, rule, map_name, squad_matches, rounds) for rule in HABITS]
    return sorted(lines, key=lambda h: (h.cost is None, h.cost or 0))


def _habit(cohorts: ReportCohorts, rule: HabitRule, map_name: str, squad_matches: int, rounds: dict[ReportCohort, RoundWon]) -> Habit:
    squad = [f for f in cohorts.select(rule.kind, ReportCohort.SQUAD, map_name=map_name) if rule.among(f)]
    top = [f for f in cohorts.select(rule.kind, ReportCohort.TOP, map_name=map_name) if rule.among(f)]
    top_rounds = rounds[ReportCohort.TOP]
    won_if = _win_rate([f for f in top if rule.condition(f)], rule, top_rounds)
    won_else = _win_rate([f for f in top if not rule.condition(f)], rule, top_rounds)
    squad_rate, top_rate = _share(squad, rule.condition), _share(top, rule.condition)
    cost = None
    if won_if is not None and won_else is not None and squad_rate.value is not None and top_rate.value is not None and squad_matches:
        cost = round((squad_rate.value - top_rate.value) * (won_if - won_else) * len(squad) / squad_matches, 1)
    return Habit(
        key=rule.key,
        label=rule.label,
        detail=rule.detail,
        top=top_rate,
        squad=squad_rate,
        won_if=won_if,
        won_else=won_else,
        cost=cost,
    )


def _share(facts: Sequence[Any], condition: Test) -> Rate:
    return Rate(count=sum(1 for f in facts if condition(f)), total=len(facts))


def _win_rate(facts: Sequence[Any], rule: HabitRule, rounds: RoundWon) -> float | None:
    return sum(rule.won(f, rounds) for f in facts) / len(facts) if facts else None


def _round_results(cohorts: ReportCohorts, cohort: ReportCohort, map_name: str) -> RoundWon:
    facts: Sequence[RoundFact] = cohorts.select(FactKind.ROUNDS, cohort, map_name=map_name)
    return {(r.match_id, r.round_index, r.team_id): r.won for r in facts if r.cohort in (Cohort.SQUAD, Cohort.TOP)}
