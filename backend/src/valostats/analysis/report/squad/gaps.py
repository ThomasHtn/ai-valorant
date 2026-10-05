"""Gaps in rounds: a squad rate against the top ranked rate in the same situation."""

from collections.abc import Callable, Sequence
from typing import Any

from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohort, ReportCohorts
from valostats.schemas.report.squad import Gap

Predicate = Callable[[Any], bool]


def gap(cohorts: ReportCohorts, kind: FactKind, success: Predicate, among: Predicate, **equal: Any) -> Gap:
    """`success` among the facts passing `among`, squad against top ranked, both filtered by `equal`."""
    k, n = _count(cohorts.select(kind, ReportCohort.SQUAD, **equal), success, among)
    top_k, top_n = _count(cohorts.select(kind, ReportCohort.TOP, **equal), success, among)
    top = top_k / top_n if top_n else None
    return Gap(k=k, n=n, top=top, top_n=top_n, rounds=round(k - n * top, 1) if top is not None and n else None)


def _count(facts: Sequence[Any], success: Predicate, among: Predicate) -> tuple[int, int]:
    base = [f for f in facts if among(f)]
    return sum(1 for f in base if success(f)), len(base)
