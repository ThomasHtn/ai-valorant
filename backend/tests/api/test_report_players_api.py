"""Players endpoints of the report on hand-made facts, without a database."""

import pytest
from fastapi import APIRouter, FastAPI
from fastapi.testclient import TestClient

from tests.api.test_report_api import FakeStore
from valostats.api.error_handlers import register_error_handlers
from valostats.api.routes import report_players
from valostats.services.report_service import ReportService


@pytest.fixture(scope="module")
def client() -> TestClient:
    app = FastAPI()
    register_error_handlers(app)
    router = APIRouter(prefix="/api")
    router.include_router(report_players.router)
    app.include_router(router)
    app.state.report_service = ReportService(FakeStore())  # type: ignore[arg-type]
    return TestClient(app)


def test_players_list(client: TestClient) -> None:
    body = client.get("/api/report/players", params={"month": "2026-09"}).json()
    alpha = {"name": "Alpha", "puuid": "alpha", "portrait": "Jett", "role": "Duelist", "rank": "Platinum 1", "matches": 3, "rounds": 3}
    assert body == [alpha]


def test_player_sheet(client: TestClient) -> None:
    body = client.get("/api/report/players/Alpha", params={"month": "2026-09"}).json()
    assert body["name"] == "Alpha" and body["rank"] == "Platinum 1"
    assert [h["key"] for h in body["headline"]] == ["acs", "kd", "adr", "kast", "fb", "openingWon", "revenge", "hs"]
    assert body["headline"][0]["cell"]["v"] == 200 and body["headline"][0]["format"] == "int"
    assert body["byMap"]["rows"][0]["art"] == {"type": "map", "slug": "ascent"}
    assert "form" not in body and len(body["economy"]) == 5
    assert body["openingDuels"]["firstBloods"] == 3


def test_unknown_player(client: TestClient) -> None:
    assert client.get("/api/report/players/Nobody", params={"month": "2026-09"}).status_code == 404
