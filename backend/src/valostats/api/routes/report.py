"""Report views: the home tree, the header of a period and the coloured tables of each domain."""

from typing import Any

from fastapi import APIRouter, Response

from valostats.api.dependencies import PeriodQueryDep, ReportServiceDep
from valostats.api.responses import json_body
from valostats.schemas.report.meta import ReportMeta, ReportPeriods
from valostats.schemas.report.tables import DomainTables

router = APIRouter(prefix="/report", tags=["report"])
NOT_FOUND: dict[int | str, dict[str, Any]] = {404: {"description": "No squad match in the period, or unknown domain"}}


@router.get("/periods", summary="Home tree: months with their evenings, patches, whole history", response_model=ReportPeriods)
def report_periods(service: ReportServiceDep) -> Response:
    return json_body(service.periods())


@router.get("/meta", summary="Header of a period: record, players and data quality", response_model=ReportMeta, responses=NOT_FOUND)
def report_meta(service: ReportServiceDep, query: PeriodQueryDep) -> Response:
    return json_body(service.meta(query))


@router.get(
    "/tables/{domain}",
    summary="Coloured tables of one domain (results, opening, combat...)",
    response_model=DomainTables,
    responses=NOT_FOUND,
)
def report_tables(domain: str, service: ReportServiceDep, query: PeriodQueryDep) -> Response:
    return json_body(service.tables(query, domain))
