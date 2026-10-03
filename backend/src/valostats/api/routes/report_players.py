"""Joueurs view: the squad players of a period and the sheet of each one."""

from typing import Any

from fastapi import APIRouter

from valostats.analysis.report.players.player_sheet import player_sheet, player_summaries
from valostats.api.dependencies import PeriodQueryDep, ReportServiceDep
from valostats.schemas.report.player import PlayerSheet, PlayerSummary

router = APIRouter(prefix="/report/players", tags=["report"])
NOT_FOUND: dict[int | str, dict[str, Any]] = {404: {"description": "No squad match in the period, or not a squad player of it"}}


@router.get("", summary="Squad players of the period with their avatar agent and rank", responses=NOT_FOUND)
def report_players(service: ReportServiceDep, query: PeriodQueryDep) -> list[PlayerSummary]:
    return service.view(query, "players", player_summaries)


@router.get("/{name}", summary="Sheet of one squad player: figures against his role, by map, agent and side", responses=NOT_FOUND)
def report_player(name: str, service: ReportServiceDep, query: PeriodQueryDep) -> PlayerSheet:
    return service.view(query, f"player:{name}", lambda cohorts: player_sheet(cohorts, name))
