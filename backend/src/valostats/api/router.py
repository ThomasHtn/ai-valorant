"""Every route, under /api."""

from fastapi import APIRouter

from valostats.api.routes import health, periods, reference, sessions

api_router = APIRouter(prefix="/api")
for module in (health, reference, periods, sessions):
    api_router.include_router(module.router)
