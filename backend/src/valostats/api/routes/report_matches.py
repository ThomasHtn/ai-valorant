"""Report views addressed by match and round: match list, match detail, rounds list, round sheet, minimap."""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Path, Request, Response

from valostats.api.dependencies import PeriodQueryDep, ReportServiceDep
from valostats.api.responses import json_body
from valostats.schemas.report.matches import MatchDetail, MatchList
from valostats.schemas.report.minimap import MinimapView
from valostats.schemas.report.rounds import RoundIndex, RoundSheet
from valostats.services.match_service import MatchService

router = APIRouter(prefix="/report", tags=["report"])
NOT_FOUND: dict[int | str, dict[str, Any]] = {404: {"description": "No squad match in the period, or unknown match, round or map"}}


def match_service(request: Request) -> MatchService:
    return request.app.state.match_service  # type: ignore[no-any-return]


MatchServiceDep = Annotated[MatchService, Depends(match_service)]


@router.get(
    "/matches",
    summary="Matches of the period grouped by evening, newest first",
    response_model=MatchList,
    responses=NOT_FOUND,
)
def report_matches(service: ReportServiceDep, query: PeriodQueryDep) -> Response:
    return json_body(service.matches(query))


@router.get("/matches/{match_id}", summary="One match: both scoreboards and the round strip", responses=NOT_FOUND)
def report_match(match_id: str, matches: MatchServiceDep) -> MatchDetail:
    return matches.detail(match_id)


@router.get(
    "/rounds",
    summary="Every squad round of the period with its cause and best moment",
    response_model=RoundIndex,
    responses=NOT_FOUND,
)
def report_rounds(service: ReportServiceDep, query: PeriodQueryDep) -> Response:
    return json_body(service.rounds(query))


@router.get("/rounds/{match_id}/{round_number}", summary="Sheet of one round: timeline, 2D replay, economy", responses=NOT_FOUND)
def report_round(match_id: str, round_number: Annotated[int, Path(ge=1)], matches: MatchServiceDep) -> RoundSheet:
    return matches.sheet(match_id, round_number)


@router.get(
    "/minimap/{map_name}",
    summary="Deaths, kills and plants of the period on one map, by side",
    response_model=MinimapView,
    responses=NOT_FOUND,
)
def report_minimap(map_name: str, service: ReportServiceDep, query: PeriodQueryDep) -> Response:
    return json_body(service.minimap(query, map_name))
