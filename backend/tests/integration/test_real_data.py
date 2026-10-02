"""Every endpoint against the local database; skipped when it is unreachable or empty.

Run after `uv run valostats import-legacy` (or a sync): `uv run pytest -m integration`.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

from valostats.core.database import get_engine

pytestmark = pytest.mark.integration


def _database_has_data() -> bool:
    try:
        with get_engine().connect() as connection:
            return bool(connection.execute(text("select count(*) from round_fact")).scalar())
    except Exception:
        return False


@pytest.fixture(scope="module")
def client() -> TestClient:
    if not _database_has_data():
        pytest.skip("database unreachable or empty")
    from valostats.main import app

    with TestClient(app) as test_client:
        yield test_client


def test_reports_of_the_latest_month_and_evening(client: TestClient):
    overview = client.get("/api/periods/overview").json()
    assert client.get("/api/periods/team").status_code == 200
    for map_name in overview["maps"]:
        assert client.get(f"/api/periods/maps/{map_name}").status_code == 200
    for player in overview["players"]:
        assert client.get(f"/api/periods/players/{player['puuid']}").status_code == 200
    sessions = client.get("/api/sessions").json()
    assert sessions and client.get(f"/api/sessions/{sessions[0]['day']}").status_code == 200


def test_reference_endpoints(client: TestClient):
    for url in ("/api/health", "/api/status", "/api/squad/players", "/api/maps", "/api/glossary"):
        assert client.get(url).status_code == 200
