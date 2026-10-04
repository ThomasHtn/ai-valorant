"""Report views built on top of the tables: Points forts et faibles, detections, trends and distributions."""

from typing import Annotated, Any

from fastapi import APIRouter, Query, Response

from valostats.analysis.report.insights.distributions import DistributionScope
from valostats.api.dependencies import PeriodQueryDep, ReportServiceDep
from valostats.api.responses import json_body
from valostats.domain.enums import Side
from valostats.schemas.report.detections import Detections
from valostats.schemas.report.distributions import Distribution
from valostats.schemas.report.findings import FindingsReport
from valostats.schemas.report.trends import Trends

router = APIRouter(prefix="/report", tags=["report"])
NOT_FOUND: dict[int | str, dict[str, Any]] = {404: {"description": "No squad match in the period, or unknown map"}}


@router.get(
    "/findings",
    summary="Points forts et faibles: tested gaps with the rounds at stake",
    response_model=FindingsReport,
    responses=NOT_FOUND,
)
def report_findings(service: ReportServiceDep, query: PeriodQueryDep) -> Response:
    return json_body(service.findings(query))


@router.get("/detections", summary="What repeats and the links between figures", response_model=Detections, responses=NOT_FOUND)
def report_detections(service: ReportServiceDep, query: PeriodQueryDep) -> Response:
    return json_body(service.detections(query))


@router.get(
    "/trends",
    summary="The squad over its whole history; the period's points are highlighted",
    response_model=Trends,
    responses=NOT_FOUND,
)
def report_trends(service: ReportServiceDep, query: PeriodQueryDep) -> Response:
    return json_body(service.trends(query))


@router.get(
    "/distributions",
    summary="Histograms of the period against top ranked",
    response_model=list[Distribution],
    responses=NOT_FOUND,
)
def report_distributions(
    service: ReportServiceDep,
    query: PeriodQueryDep,
    map_name: Annotated[str | None, Query(alias="map", description="One map, e.g. Split")] = None,
    side: Annotated[Side | None, Query(description="att or def")] = None,
) -> Response:
    return json_body(service.distributions(query, DistributionScope(map_name=map_name, side=side)))
