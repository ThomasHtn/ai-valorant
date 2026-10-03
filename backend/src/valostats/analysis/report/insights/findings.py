"""Points forts et faibles: every comparison of the catalogue tested, corrected together, and the gaps that hold.

Each test compares a squad proportion with one reference:
- opponents (same matches, same level) for team play that is not zero-sum: revenge, isolated deaths,
  deaths without damage, player figures against opponents of the same role;
- top ranked for round outcomes and the meta: in the same matches the opponents' conversion is the
  mirror of the squad's (their post-plant = 1 - our retake), so testing against them would only
  duplicate each finding.

Steps: two-proportion test (Fisher for small samples), Benjamini-Hochberg over every test of the period,
then "confirmed" (passes the correction) or "lead" (p < LEAD_P_VALUE alone). The gap is converted into
rounds: (squad rate - reference rate) x squad sample x leverage, the leverage being the event's weight
on the round measured in top ranked, P(won | event) - P(won | no event), or 1 when the metric is the
round result itself. Findings with less than MIN_GAP_ROUNDS at stake are dropped.
"""

from collections import Counter
from collections.abc import Sequence
from dataclasses import dataclass
from typing import Any

from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohort, ReportCohorts
from valostats.analysis.report.insights.finding_catalogue import finding_catalogue
from valostats.analysis.report.insights.finding_tests import UNIT_KIND, FindingTest, Predicate, Unit
from valostats.analysis.report.insights.rewatch import rewatch_rounds
from valostats.analysis.report.rounds.loss_causes import loss_cause
from valostats.analysis.statistics.proportions import benjamini_hochberg, proportions_p_value
from valostats.constants.agents import role_of
from valostats.constants.analysis import FDR_Q, LEAD_P_VALUE
from valostats.constants.findings import KAST_MAX_LEVERAGE, MIN_FINDING_SAMPLE, MIN_GAP_ROUNDS, THIRD_ROUNDS
from valostats.domain.enums import FindingStatus, LossCause, Reference
from valostats.domain.facts import RoundFact
from valostats.schemas.common import Rate
from valostats.schemas.report.findings import BonusRoundCheck, Finding, FindingSide, FindingsReport


@dataclass(frozen=True)
class Tested:
    test: FindingTest
    squad: Rate
    opp: Rate
    top: Rate
    leverage: float
    gap_rounds: float
    p_value: float
    matches: int
    rewatch_facts: Sequence[Any]


class FindingContext:
    """Facts of each unit and cohort, sliced by scope and memoised, plus the top ranked leverages."""

    def __init__(self, cohorts: ReportCohorts) -> None:
        self.cohorts = cohorts
        self.squad_names = {p.name for p in cohorts.players()}
        # Round result of a team, to know whether a death's round was won (kill facts do not say).
        self._round_won: dict[tuple[str, int, str], bool] = {}
        for cohort in ReportCohort:
            for fact in cohorts.select(FactKind.ROUNDS, cohort):
                self._round_won[(fact.match_id, fact.round_index, fact.team_id)] = fact.won
        self._slices: dict[tuple[Any, ...], Sequence[Any]] = {}
        self._leverages: dict[tuple[Unit, str, str], float] = {}

    def won(self, unit: Unit, fact: Any) -> bool:
        """Whether the round of the fact was won by the fact's team (the victim's team for a death)."""
        if unit is Unit.DEATHS:
            return self._round_won.get((fact.match_id, fact.round_index, fact.victim_team), False)
        return bool(fact.won)

    def facts(self, test: FindingTest, cohort: ReportCohort) -> Sequence[Any]:
        """Facts of a cohort in the test's scope (map, side, player or role), memoised."""
        role = test.player.role if test.player and cohort is not ReportCohort.SQUAD else None
        name = test.player.name if test.player and cohort is ReportCohort.SQUAD else None
        key = (test.unit, cohort, test.map_name, test.side, role, name)
        if key not in self._slices:
            self._slices[key] = self._slice(test, cohort, role, name)
        return self._slices[key]

    def leverage(self, test: FindingTest) -> float:
        """Weight of the event on the round in top ranked: P(won | event) - P(won | no event), on the whole top sample."""
        if test.round_outcome:
            return 1.0
        key = (test.unit, test.kind, test.metric)
        if key not in self._leverages:
            base = [f for f in self.cohorts.select(UNIT_KIND[test.unit], ReportCohort.TOP) if test.among(f)]
            yes = [self.won(test.unit, f) for f in base if test.success(f)]
            no = [self.won(test.unit, f) for f in base if not test.success(f)]
            self._leverages[key] = sum(yes) / len(yes) - sum(no) / len(no) if yes and no else 0.0
        leverage = self._leverages[key]
        # KAST is partly a consequence of winning (you survive the rounds you win): cap its weight.
        return min(leverage, KAST_MAX_LEVERAGE) if test.kind == "kast" else leverage

    def _slice(self, test: FindingTest, cohort: ReportCohort, role: str | None, name: str | None) -> Sequence[Any]:
        side_field = "victim_side" if test.unit is Unit.DEATHS else "side"
        equal: dict[str, Any] = {}
        if test.map_name is not None:
            equal["map_name"] = test.map_name
        if test.side is not None:
            equal[side_field] = test.side
        facts = self.cohorts.select(UNIT_KIND[test.unit], cohort, **equal)
        if test.unit is Unit.PLAYER_ROUNDS and cohort is ReportCohort.SQUAD:
            facts = [f for f in facts if f.name in self.squad_names]
        if name is not None:
            field = "victim" if test.unit is Unit.DEATHS else "name"
            facts = [f for f in facts if getattr(f, field) == name]
        if role is not None:
            facts = [f for f in facts if self._role(test.unit, f) == role]
        return facts

    def _role(self, unit: Unit, fact: Any) -> str:
        if unit is Unit.DEATHS:
            return self.cohorts.role_of_player(fact.match_id, fact.victim_puuid)
        return role_of(fact.agent)


def proportion(facts: Sequence[Any], success: Predicate, among: Predicate) -> tuple[Rate, list[Any]]:
    """The rate of `success` among the facts passing `among`, and that base."""
    base = [f for f in facts if among(f)]
    return Rate(count=sum(1 for f in base if success(f)), total=len(base)), base


def run_test(test: FindingTest, context: FindingContext) -> Tested | None:
    """Test one comparison; None when the squad sample is too small or the reference is empty."""
    squad, base = proportion(context.facts(test, ReportCohort.SQUAD), test.success, test.among)
    if squad.total < MIN_FINDING_SAMPLE:
        return None
    opp, _ = proportion(context.facts(test, ReportCohort.OPPONENTS), test.success, test.among)
    top, _ = proportion(context.facts(test, ReportCohort.TOP), test.success, test.among)
    reference = opp if test.reference is Reference.OPPONENTS else top
    if not reference.total or squad.value is None or reference.value is None:
        return None
    leverage = context.leverage(test)
    gap = (squad.value - reference.value) * squad.total * leverage
    p_value = proportions_p_value(squad.count, squad.total, reference.count, reference.total)
    # Rounds to rewatch: the facts that pushed the gap in the finding's direction.
    event_helps = leverage >= 0
    show_event = (gap > 0) == event_helps
    rewatch = [f for f in base if bool(test.success(f)) == show_event]
    matches = len({f.match_id for f in base})
    return Tested(test, squad, opp, top, leverage, gap, p_value, matches, rewatch)


def findings_report(cohorts: ReportCohorts) -> FindingsReport:
    """Run the catalogue, correct for multiple testing and keep the gaps that hold, biggest first."""
    context = FindingContext(cohorts)
    tested = [t for test in finding_catalogue(cohorts) if (t := run_test(test, context)) is not None]
    confirmed = {id(t) for t in benjamini_hochberg(tested, lambda t: t.p_value)}
    findings = []
    for t in tested:
        if abs(t.gap_rounds) < MIN_GAP_ROUNDS:
            continue
        if id(t) in confirmed:
            status = FindingStatus.CONFIRMED
        elif t.p_value < LEAD_P_VALUE:
            status = FindingStatus.LEAD
        else:
            continue
        findings.append(_finding(t, status))
    findings.sort(key=lambda f: -abs(f.gap_rounds))
    return FindingsReport(tests=len(tested), q=FDR_Q, findings=findings, bonus_round=bonus_round_check(cohorts))


def is_bonus_round(fact: RoundFact) -> bool:
    """Third round of a half after the team won the pistol and the second round."""
    return fact.round_index in THIRD_ROUNDS and fact.pistol_won is True and fact.second_round_won is True


def bonus_round_check(cohorts: ReportCohorts) -> BonusRoundCheck:
    """The bonus round against every reference, shown whatever its p-value (a known weak spot)."""

    def rate(cohort: ReportCohort) -> tuple[Rate, list[Any]]:
        return proportion(cohorts.select(FactKind.ROUNDS, cohort), lambda r: r.won, is_bonus_round)

    squad, base = rate(ReportCohort.SQUAD)
    top, _ = rate(ReportCohort.TOP)
    lost = [r for r in base if not r.won]
    causes: Counter[LossCause] = Counter(c for r in lost if (c := loss_cause(r)) is not None)
    gap = (squad.value - top.value) * squad.total if squad.value is not None and top.value is not None else None
    return BonusRoundCheck(
        metric="R3 bonus gagné",
        squad=squad,
        opp=rate(ReportCohort.OPPONENTS)[0],
        top=top,
        hist=rate(ReportCohort.HISTORY)[0],
        p_value=round(proportions_p_value(squad.count, squad.total, top.count, top.total), 4),
        gap_rounds=round(gap, 1) if gap is not None else None,
        lost_causes=dict(causes),
        rewatch=rewatch_rounds(lost),
    )


def _finding(t: Tested, status: FindingStatus) -> Finding:
    test = t.test
    return Finding(
        side=FindingSide.STRENGTH if t.gap_rounds > 0 else FindingSide.WEAKNESS,
        group=test.group,
        scope=test.scope,
        metric=test.metric,
        kind=test.kind,
        art=test.art,
        map_name=test.map_name,
        scope_side=test.side,
        player=test.player.name if test.player else None,
        reference=test.reference,
        squad=t.squad,
        opp=t.opp,
        top=t.top,
        leverage=round(t.leverage, 3),
        gap_rounds=round(t.gap_rounds, 1),
        p_value=round(t.p_value, 5),
        status=status,
        matches=t.matches,
        lost_causes=weakness_loss_causes(t),
        rewatch=rewatch_rounds(t.rewatch_facts),
    )


def weakness_loss_causes(t: Tested) -> dict[LossCause, int]:
    """Why the rounds behind a team weakness were lost, so the analyst sees what to work on."""
    if t.gap_rounds >= 0 or t.test.unit is not Unit.ROUNDS:
        return {}
    causes = Counter(c for r in t.rewatch_facts if (c := loss_cause(r)) is not None)
    return dict(causes.most_common())
