"""Joueurs view: the squad players of a period and the sheet of each one."""

from typing import Any

from fastapi import APIRouter, Response

from valostats.api.dependencies import PeriodQueryDep, ReportServiceDep
from valostats.api.responses import json_body
from valostats.schemas.report.player import PlayerSheet, PlayerSummary

router = APIRouter(prefix="/report/players", tags=["report"])
NOT_FOUND: dict[int | str, dict[str, Any]] = {404: {"description": "No squad match in the period, or not a squad player of it"}}


@router.get(
    "",
    summary="Squad players of the period with their avatar agent and rank",
    response_model=list[PlayerSummary],
    responses=NOT_FOUND,
)
def report_players(service: ReportServiceDep, query: PeriodQueryDep) -> Response:
    return json_body(service.players(query))


@router.get(
    "/{name}",
    summary="Sheet of one squad player: figures against his role, by map, agent and side",
    response_model=PlayerSheet,
    responses=NOT_FOUND,
)
def report_player(name: str, service: ReportServiceDep, query: PeriodQueryDep) -> Response:
    return json_body(service.player(query, name))
