"""Period and reference endpoints on synthetic facts, without a database."""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from tests.factories import SQUAD, TEST_MAP, Kill, RoundSpec, make_match
from valostats.analysis.extraction.player_facts import extract_players
from valostats.analysis.extraction.round_facts import extract_rounds
from valostats.analysis.extraction.win_probability import WinProbabilityTable
from valostats.api.error_handlers import register_error_handlers
from valostats.api.router import api_router
from valostats.services.facts_store import SquadFacts, TopFacts
from valostats.services.period_service import PeriodService

MAPS = {TEST_MAP.name: TEST_MAP}


def _round(i: int) -> RoundSpec:
    opening = Kill(2000, "R1", "B1") if i % 2 else Kill(2000, "B1", "R1")
    plant = (30_000, "A", "R3") if i % 4 == 0 else None
    return RoundSpec("Red" if i % 3 else "Blue", [opening, Kill(8000, "R2", "B2", x=1000)], plant=plant)


def _rounds(n: int) -> list[RoundSpec]:
    # Varied outcomes so every section has wins and losses.
    return [_round(i) for i in range(n)]


class StaticStore:
    """Duck-typed FactsStore serving facts extracted from synthetic matches."""

    def __init__(self) -> None:
        matches = [make_match(_rounds(20), f"m{i}", f"2026-09-{10 + i:02d}T19:00:00Z") for i in range(6)]
        table = WinProbabilityTable.from_matches(matches)
        rounds, players = extract_rounds(matches, MAPS, SQUAD), extract_players(matches, MAPS, table, SQUAD)
        self._squad = SquadFacts(1, rounds.rounds, rounds.deaths, players.rounds, players.matches, SQUAD, table)
        top_rounds, top_players = extract_rounds(matches, MAPS, None), extract_players(matches, MAPS, table, None)
        self._top = TopFacts(1, len(matches), top_rounds.rounds, top_rounds.deaths, top_players.rounds, top_players.matches)

    def squad(self) -> SquadFacts:
        return self._squad

    def top(self) -> TopFacts:
        return self._top

    def maps(self):
        return MAPS


@pytest.fixture(scope="module")
def client() -> TestClient:
    app = FastAPI()
    register_error_handlers(app)
    app.include_router(api_router)
    app.state.period_service = PeriodService(StaticStore())  # type: ignore[arg-type]
    return TestClient(app)


def test_available_periods(client: TestClient):
    body = client.get("/api/periods").json()
    assert body["months"] == ["2026-09"] and body["patches"] == ["13.05"]


def test_overview_lists_maps_and_profiled_players(client: TestClient):
    body = client.get("/api/periods/overview?month=2026-09").json()
    assert body["title"] == "Septembre 2026"
    assert body["maps"] == ["Ascent"]
    assert {p["name"] for p in body["players"]} == {"R1", "R2", "R3", "R4", "R5"}


def test_team_report_has_every_section_in_camel_case(client: TestClient):
    body = client.get("/api/periods/team").json()
    assert body["kpis"]["wins"] + body["kpis"]["losses"] == 6
    assert set(body) >= {"summary", "kpis", "mapPool", "findings", "roundDrivers", "economy", "opening", "evolution"}
    rate = body["mapPool"][0]["rounds"]
    assert rate["value"] == rate["count"] / rate["total"]


def test_map_sheet_and_player_profile(client: TestClient):
    assert client.get("/api/periods/maps/Ascent").json()["matches"] == 6
    profile = client.get("/api/periods/players/r1").json()
    assert profile["name"] == "R1" and profile["rounds"] == 120


def test_unknown_period_map_or_player_is_404(client: TestClient):
    assert client.get("/api/periods/team?month=2020-01").status_code == 404
    assert client.get("/api/periods/maps/Bind").status_code == 404
    assert client.get("/api/periods/players/nobody").status_code == 404


@pytest.mark.parametrize("query", ["month=2026-09&patch=13.05", "start=2026-09-01", "start=2026-09-10&end=2026-09-01", "month=09-2026"])
def test_invalid_period_queries_are_422(client: TestClient, query: str):
    assert client.get(f"/api/periods/team?{query}").status_code == 422
