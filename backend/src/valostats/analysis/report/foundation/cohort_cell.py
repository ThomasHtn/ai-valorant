"""Cells whose metric needs more than one list of facts per cohort (e.g. kills from a zone over deaths in it).

`cells.cell` covers the usual case (one fact kind, the same filter on every cohort). Here the caller
gives a function that measures one cohort however it needs, and gets back the same `StatCell` shape.
"""

from collections.abc import Callable, Sequence

from valostats.analysis.report.foundation.cells import Measure, rounded
from valostats.analysis.report.foundation.cohorts import REFERENCE_COHORTS, ReportCohort
from valostats.schemas.report.tables import CellValue, StatCell

CohortMeasure = Callable[[ReportCohort], Measure]


def cohort_cell(measure: CohortMeasure, references: Sequence[ReportCohort] = REFERENCE_COHORTS) -> StatCell:
    """The squad value and each reference, each computed by `measure(cohort)`; unlisted references stay empty."""
    value, sample = measure(ReportCohort.SQUAD)
    out: dict[str, CellValue | int] = {"v": rounded(value), "n": sample}
    for cohort in references:
        ref_value, ref_sample = measure(cohort)
        out[cohort.value] = rounded(ref_value) if ref_sample else None
        out[f"{cohort.value}_n"] = ref_sample
    return StatCell.model_validate(out)
