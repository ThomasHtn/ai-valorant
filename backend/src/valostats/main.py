"""FastAPI application. Run with `uv run uvicorn valostats.main:app --reload`."""

import logging
import threading
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from valostats.api.error_handlers import register_error_handlers
from valostats.api.router import api_router
from valostats.core.config import get_settings
from valostats.core.database import get_session_factory
from valostats.services.facts_store import FactsStore
from valostats.services.match_service import MatchService
from valostats.services.report_service import ReportService
from valostats.services.snapshot_store import SnapshotStore

logger = logging.getLogger(__name__)


def _warm_up(store: FactsStore) -> None:
    """Load the facts in the background so the first report does not wait for them."""
    try:
        store.squad()
        store.top()
        logger.info("facts loaded")
    except Exception:
        logger.exception("facts warm-up failed; they will load on the first request")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    store = FactsStore(get_session_factory())
    app.state.facts_store = store
    app.state.report_service = ReportService(store, SnapshotStore(get_session_factory()))
    app.state.match_service = MatchService(store, get_session_factory())
    threading.Thread(target=_warm_up, args=(store,), daemon=True).start()
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="ValoStats API", version="1.0.0", description="Squad statistics computed from Valorant matches.", lifespan=lifespan)
    app.add_middleware(CORSMiddleware, allow_origins=get_settings().cors_origins, allow_methods=["GET"], allow_headers=["*"])
    register_error_handlers(app)
    app.include_router(api_router)
    return app


app = create_app()
