"""Report views: the home tree, the header of a period and the coloured tables of each domain."""

from typing import Any

from fastapi import APIRouter

from valostats.api.dependencies import PeriodQueryDep, ReportServiceDep
from valostats.schemas.report.meta import ReportMeta, ReportPeriods
from valostats.schemas.report.tables import DomainTables

router = APIRouter(prefix="/report", tags=["report"])
NOT_FOUND: dict[int | str, dict[str, Any]] = {404: {"description": "No squad match in the period, or unknown domain"}}


@router.get("/periods", summary="Home tree: months with their evenings, patches, whole history")
def report_periods(service: ReportServiceDep) -> ReportPeriods:
    return service.periods()


@router.get("/meta", summary="Header of a period: record, players and data quality", responses=NOT_FOUND)
def report_meta(service: ReportServiceDep, query: PeriodQueryDep) -> ReportMeta:
    return service.meta(query)


@router.get("/tables/{domain}", summary="Coloured tables of one domain (results, opening, combat...)", responses=NOT_FOUND)
def report_tables(domain: str, service: ReportServiceDep, query: PeriodQueryDep) -> DomainTables:
    return service.tables(query, domain)
