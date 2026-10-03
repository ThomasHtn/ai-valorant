"""Report views built on top of the tables: Points forts et faibles, detections, trends and distributions."""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, Request

from valostats.analysis.report.foundation.period_selection import PeriodQuery
from valostats.analysis.report.insights.detections import detections
from valostats.analysis.report.insights.distributions import DistributionScope, distributions
from valostats.analysis.report.insights.findings import findings_report
from valostats.analysis.report.insights.trends import trends
from valostats.api.dependencies import PeriodQueryDep, ReportServiceDep
from valostats.domain.enums import Side
from valostats.schemas.report.detections import Detections
from valostats.schemas.report.distributions import Distribution
from valostats.schemas.report.findings import FindingsReport
from valostats.schemas.report.trends import Trends
from valostats.services.facts_store import FactsStore
from valostats.services.report_service import ReportService

router = APIRouter(prefix="/report", tags=["report"])
NOT_FOUND: dict[int | str, dict[str, Any]] = {404: {"description": "No squad match in the period"}}


def facts_store(request: Request) -> FactsStore:
    """The store holds the squad's whole history, which the trends need beyond the period's cohorts."""
    return request.app.state.facts_store  # type: ignore[no-any-return]


FactsStoreDep = Annotated[FactsStore, Depends(facts_store)]


def _findings(service: ReportService, query: PeriodQuery) -> FindingsReport:
    return service.view(query, "findings", findings_report)


@router.get("/findings", summary="Points forts et faibles: tested gaps with the rounds at stake", responses=NOT_FOUND)
def report_findings(service: ReportServiceDep, query: PeriodQueryDep) -> FindingsReport:
    return _findings(service, query)


@router.get("/detections", summary="What repeats and the links between figures", responses=NOT_FOUND)
def report_detections(service: ReportServiceDep, query: PeriodQueryDep) -> Detections:
    return service.view(query, "detections", detections)


@router.get("/trends", summary="The squad over its whole history; the period's points are highlighted", responses=NOT_FOUND)
def report_trends(service: ReportServiceDep, query: PeriodQueryDep, store: FactsStoreDep) -> Trends:
    return service.view(query, "trends", lambda cohorts: trends(cohorts, store.squad()))


@router.get("/distributions", summary="Histograms of the period against top ranked", responses=NOT_FOUND)
def report_distributions(
    service: ReportServiceDep,
    query: PeriodQueryDep,
    map_name: Annotated[str | None, Query(alias="map", description="One map, e.g. Split")] = None,
    side: Annotated[Side | None, Query(description="att or def")] = None,
) -> list[Distribution]:
    scope = DistributionScope(map_name=map_name, side=side)
    return service.view(query, scope.cache_key, lambda cohorts: distributions(cohorts, scope))
