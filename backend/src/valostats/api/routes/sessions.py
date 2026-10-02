"""Session report: one evening of squad matches."""

from datetime import date
from typing import Any

from fastapi import APIRouter

from valostats.api.dependencies import SessionServiceDep
from valostats.schemas.session import SessionListItem, SessionReport

router = APIRouter(prefix="/sessions", tags=["sessions"])
NOT_FOUND: dict[int | str, dict[str, Any]] = {404: {"description": "No session on that day"}}


@router.get("", summary="Every evening, newest first")
def list_sessions(service: SessionServiceDep) -> list[SessionListItem]:
    return service.list()


@router.get("/latest", summary="The latest evening", responses=NOT_FOUND)
def latest_session(service: SessionServiceDep) -> SessionReport:
    return service.report(None)


@router.get("/{day}", summary="The evening starting on this day", responses=NOT_FOUND)
def session_report(day: date, service: SessionServiceDep) -> SessionReport:
    return service.report(day)
