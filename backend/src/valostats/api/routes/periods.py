"""Period report: a month, a patch or a date range."""

from typing import Any

from fastapi import APIRouter

from valostats.api.dependencies import PeriodQueryDep, PeriodServiceDep
from valostats.schemas.period.map_sheet import MapSheet
from valostats.schemas.period.player import PlayerProfile
from valostats.schemas.period.report import AvailablePeriods, PeriodOverview, TeamReport

router = APIRouter(prefix="/periods", tags=["periods"])
NOT_FOUND: dict[int | str, dict[str, Any]] = {404: {"description": "No squad match in the period"}}


@router.get("", summary="Months and patches with squad matches")
def available_periods(service: PeriodServiceDep) -> AvailablePeriods:
    return service.available()


@router.get("/overview", summary="What the period covers: title, maps, players with a profile", responses=NOT_FOUND)
def period_overview(service: PeriodServiceDep, query: PeriodQueryDep) -> PeriodOverview:
    return service.overview(query)


@router.get("/team", summary="Team tab: strengths, weaknesses and every team section", responses=NOT_FOUND)
def team_report(service: PeriodServiceDep, query: PeriodQueryDep) -> TeamReport:
    return service.team(query)


@router.get("/maps/{map_name}", summary="Map sheet against top ranked games on the same map", responses=NOT_FOUND)
def map_report(map_name: str, service: PeriodServiceDep, query: PeriodQueryDep) -> MapSheet:
    return service.map_sheet(query, map_name)


@router.get("/players/{puuid}", summary="Individual profile of a squad player", responses=NOT_FOUND)
def player_report(puuid: str, service: PeriodServiceDep, query: PeriodQueryDep) -> PlayerProfile:
    return service.player(query, puuid)
