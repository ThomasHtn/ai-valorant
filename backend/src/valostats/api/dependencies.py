"""Shared objects of the running application, injected into the routes."""

from datetime import date
from typing import Annotated

from fastapi import Depends, HTTPException, Query, Request, status

from valostats.analysis.period.selection import PeriodQuery
from valostats.services.period_service import PeriodService
from valostats.services.session_service import SessionService


def period_service(request: Request) -> PeriodService:
    return request.app.state.period_service  # type: ignore[no-any-return]


def session_service(request: Request) -> SessionService:
    return request.app.state.session_service  # type: ignore[no-any-return]


def period_query(
    month: Annotated[str | None, Query(pattern=r"^\d{4}-\d{2}$", description="Month, e.g. 2026-09")] = None,
    patch: Annotated[str | None, Query(pattern=r"^\d+\.\d+$", description="Game patch, e.g. 13.05")] = None,
    start: Annotated[date | None, Query(description="First day of a custom range (with `end`)")] = None,
    end: Annotated[date | None, Query(description="Last day of a custom range (with `start`)")] = None,
) -> PeriodQuery:
    """At most one way of choosing the period; nothing means the latest month played."""
    forms = [month is not None, patch is not None, start is not None or end is not None]
    if sum(forms) > 1 or (start is None) != (end is None) or (start and end and start > end):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Give either month, patch, or start and end (start <= end).")
    return PeriodQuery(month=month, patch=patch, start=start, end=end)


PeriodServiceDep = Annotated[PeriodService, Depends(period_service)]
SessionServiceDep = Annotated[SessionService, Depends(session_service)]
PeriodQueryDep = Annotated[PeriodQuery, Depends(period_query)]
