"""Table cells: one metric computed on the squad and on each reference cohort.

A metric is a small function `facts -> (value, sample)`, built with the helpers below:

    won_rate = ratio(lambda r: r.won)                                # rounds won / rounds
    attack_won = ratio(lambda r: r.won, lambda r: r.side is Side.ATTACK)
    acs = sum_ratio(lambda p: p.score)                               # score per round
    plant_time = median(lambda r: r.plant_ms / 1000 if r.plant_ms else None)

`cell(cohorts, FactKind.ROUNDS, won_rate, map_name="Split")` then returns a `StatCell` with the squad
value and the top / opp / hist values of the same metric on the same filter.
"""

import statistics
from collections.abc import Callable, Sequence
from typing import Any

from valostats.analysis.report.foundation.cohorts import REFERENCE_COHORTS, FactKind, ReportCohort, ReportCohorts, SquadPlayer
from valostats.constants.agents import role_of
from valostats.constants.report import VALUE_DECIMALS
from valostats.domain.enums import Reference
from valostats.schemas.report.tables import CellValue, StatCell

# A computed value and the sample it rests on (rounds, deaths, duels...).
Measure = tuple[float | None, int]
Metric = Callable[[Sequence[Any]], Measure]
Predicate = Callable[[Any], bool]
Getter = Callable[[Any], float | None]


def ratio(success: Predicate, among: Predicate | None = None) -> Metric:
    """Share of the facts passing `among` (all by default) that also pass `success`."""

    def measure(facts: Sequence[Any]) -> Measure:
        base = facts if among is None else [f for f in facts if among(f)]
        if not base:
            return None, 0
        return sum(1 for f in base if success(f)) / len(base), len(base)

    return measure


def mean(value: Getter, among: Predicate | None = None) -> Metric:
    """Average of `value` over the facts passing `among`; facts whose value is None are skipped."""

    def measure(facts: Sequence[Any]) -> Measure:
        values = [v for f in facts if among is None or among(f) if (v := value(f)) is not None]
        return (sum(values) / len(values), len(values)) if values else (None, 0)

    return measure


def median(value: Getter, among: Predicate | None = None) -> Metric:
    """Median of `value`, same rules as `mean`. Use it for times, which have long tails."""

    def measure(facts: Sequence[Any]) -> Measure:
        values = [v for f in facts if among is None or among(f) if (v := value(f)) is not None]
        return (statistics.median(values), len(values)) if values else (None, 0)

    return measure


def sum_ratio(numerator: Callable[[Any], float], denominator: Callable[[Any], float] | None = None) -> Metric:
    """Sum of `numerator` divided by the sum of `denominator`, or by the number of facts (a "per round" value).

    The sample is the number of facts: e.g. ADR = sum_ratio(lambda p: p.damage) over player-rounds.
    """

    def measure(facts: Sequence[Any]) -> Measure:
        if not facts:
            return None, 0
        total = sum(numerator(f) for f in facts)
        divisor = len(facts) if denominator is None else sum(denominator(f) for f in facts)
        return (total / divisor if divisor else None), len(facts)

    return measure


def count(success: Predicate | None = None) -> Metric:
    """Number of facts passing `success` (all by default); the sample is the number of facts."""

    def measure(facts: Sequence[Any]) -> Measure:
        return float(sum(1 for f in facts if success is None or success(f))), len(facts)

    return measure


def rounded(value: CellValue) -> CellValue:
    """Keep the JSON short: floats to `VALUE_DECIMALS` decimals, other values unchanged."""
    return round(value, VALUE_DECIMALS) if isinstance(value, float) else value


def fixed(value: CellValue, sample: int | None = None) -> StatCell:
    """A cell without references: counts, labels, records like '12-15'."""
    return StatCell(v=rounded(value), n=sample)


def cell(
    cohorts: ReportCohorts,
    kind: FactKind,
    metric: Metric,
    *,
    where: Predicate | None = None,
    reference_where: Predicate | None = None,
    history_where: Predicate | None = None,
    references: Sequence[ReportCohort] = REFERENCE_COHORTS,
    **equal: Any,
) -> StatCell:
    """The metric on the squad and on each reference cohort, all filtered by the same `equal` fields.

    `where` narrows the squad facts (e.g. one player). By default the references get the same filter;
    `reference_where` replaces it for top and opp, `history_where` for hist (see `player_cell`).
    """
    value, sample = metric(_filtered(cohorts.select(kind, ReportCohort.SQUAD, **equal), where))
    out: dict[str, CellValue | int] = {"v": rounded(value), "n": sample}
    for cohort in references:
        if cohort is ReportCohort.HISTORY:
            keep = history_where if history_where is not None else where
        else:
            keep = reference_where if reference_where is not None else where
        ref_value, ref_sample = metric(_filtered(cohorts.select(kind, cohort, **equal), keep))
        out[cohort.value] = rounded(ref_value) if ref_sample else None
        out[f"{cohort.value}_n"] = ref_sample
    return StatCell.model_validate(out)


def versus_history(symmetric: StatCell) -> StatCell:
    """A symmetric cell (pistols, 3v3, full buy against full buy) is judged against the squad history, whatever the column says."""
    return symmetric.model_copy(update={"ref": Reference.HISTORY})


def player_cell(cohorts: ReportCohorts, kind: FactKind, metric: Metric, player: SquadPlayer, **equal: Any) -> StatCell:
    """A cell of one squad player: top and opp references are players of his main role, hist is himself.

    Works on facts with `name` and `agent` fields (player-rounds, player-matches).
    """
    return cell(
        cohorts,
        kind,
        metric,
        where=lambda f: f.name == player.name,
        reference_where=lambda f: role_of(f.agent) == player.role,
        history_where=lambda f: f.name == player.name,
        **equal,
    )


def _filtered(facts: Sequence[Any], keep: Predicate | None) -> Sequence[Any]:
    return facts if keep is None else [f for f in facts if keep(f)]
