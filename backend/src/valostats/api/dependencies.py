"""Shared objects of the running application, injected into the routes."""

from datetime import date
from typing import Annotated

from fastapi import Depends, HTTPException, Query, Request, status

from valostats.analysis.report.foundation.period_selection import PeriodQuery
from valostats.services.report_service import ReportService


def report_service(request: Request) -> ReportService:
    return request.app.state.report_service  # type: ignore[no-any-return]


def period_query(
    month: Annotated[str | None, Query(pattern=r"^\d{4}-\d{2}$", description="Month, e.g. 2026-09")] = None,
    patch: Annotated[str | None, Query(pattern=r"^\d+\.\d+$", description="Game patch, e.g. 13.05")] = None,
    start: Annotated[date | None, Query(description="First day of a custom range (with `end`); an evening is start = end")] = None,
    end: Annotated[date | None, Query(description="Last day of a custom range (with `start`)")] = None,
) -> PeriodQuery:
    """At most one way of choosing the period; nothing means the latest month played."""
    forms = [month is not None, patch is not None, start is not None or end is not None]
    if sum(forms) > 1 or (start is None) != (end is None) or (start and end and start > end):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Give either month, patch, or start and end (start <= end).")
    return PeriodQuery(month=month, patch=patch, start=start, end=end)


ReportServiceDep = Annotated[ReportService, Depends(report_service)]
PeriodQueryDep = Annotated[PeriodQuery, Depends(period_query)]
