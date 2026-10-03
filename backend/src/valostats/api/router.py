"""Every route, under /api."""

from fastapi import APIRouter

from valostats.api.routes import health, reference, report, report_insights, report_matches, report_players

api_router = APIRouter(prefix="/api")
for module in (health, reference, report, report_insights, report_matches, report_players):
    api_router.include_router(module.router)
