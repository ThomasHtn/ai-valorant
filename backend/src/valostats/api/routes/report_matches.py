"""Report views addressed by match and round: match list, match detail, rounds list, round sheet, minimap."""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Path, Request

from valostats.analysis.report.rounds.matches import match_list
from valostats.analysis.report.rounds.minimap import minimap_view
from valostats.analysis.report.rounds.round_lines import rounds_index
from valostats.api.dependencies import PeriodQueryDep, ReportServiceDep
from valostats.core.errors import NotFoundError
from valostats.schemas.report.matches import MatchDetail, MatchList
from valostats.schemas.report.minimap import MinimapView
from valostats.schemas.report.rounds import RoundIndex, RoundSheet
from valostats.services.match_service import MatchService

router = APIRouter(prefix="/report", tags=["report"])
NOT_FOUND: dict[int | str, dict[str, Any]] = {404: {"description": "No squad match in the period, or unknown match, round or map"}}


def match_service(request: Request) -> MatchService:
    return request.app.state.match_service  # type: ignore[no-any-return]


MatchServiceDep = Annotated[MatchService, Depends(match_service)]


@router.get("/matches", summary="Matches of the period grouped by evening, newest first", responses=NOT_FOUND)
def report_matches(service: ReportServiceDep, query: PeriodQueryDep) -> MatchList:
    return service.view(query, "matches", match_list)


@router.get("/matches/{match_id}", summary="One match: both scoreboards and the round strip", responses=NOT_FOUND)
def report_match(match_id: str, matches: MatchServiceDep) -> MatchDetail:
    return matches.detail(match_id)


@router.get("/rounds", summary="Every squad round of the period with its cause and best moment", responses=NOT_FOUND)
def report_rounds(service: ReportServiceDep, matches: MatchServiceDep, query: PeriodQueryDep) -> RoundIndex:
    return service.view(query, "rounds", lambda cohorts: rounds_index(cohorts, matches.win_probability()))


@router.get("/rounds/{match_id}/{round_number}", summary="Sheet of one round: timeline, 2D replay, economy", responses=NOT_FOUND)
def report_round(match_id: str, round_number: Annotated[int, Path(ge=1)], matches: MatchServiceDep) -> RoundSheet:
    return matches.sheet(match_id, round_number)


@router.get("/minimap/{map_name}", summary="Deaths, kills and plants of the period on one map, by side", responses=NOT_FOUND)
def report_minimap(map_name: str, service: ReportServiceDep, matches: MatchServiceDep, query: PeriodQueryDep) -> MinimapView:
    game_map = matches.maps().get(map_name)
    if game_map is None:
        raise NotFoundError(f"Unknown map {map_name}.")
    return service.view(query, f"minimap:{map_name}", lambda cohorts: minimap_view(cohorts, game_map))
