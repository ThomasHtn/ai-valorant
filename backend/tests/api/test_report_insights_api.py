"""Findings, detections, trends and distributions endpoints on hand-made facts, without a database."""

from dataclasses import dataclass, field
from typing import Any

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from tests.report_facts import AUGUST, SEPTEMBER, match_fact, player_match, player_round, round_fact
from valostats.api.error_handlers import register_error_handlers
from valostats.api.routes import report_insights
from valostats.domain.enums import Cohort, Side
from valostats.services.report_service import ReportService


@dataclass
class FakeFacts:
    """Duck-typed SquadFacts / TopFacts."""

    version: int = 1
    matches: list[Any] = field(default_factory=list)
    rounds: list[Any] = field(default_factory=list)
    kills: list[Any] = field(default_factory=list)
    player_rounds: list[Any] = field(default_factory=list)
    player_matches: list[Any] = field(default_factory=list)
    portraits: dict[str, str] = field(default_factory=dict)
    squad: set[str] = field(default_factory=lambda: {"alpha"})
    match_count: int = 1


class FakeStore:
    def __init__(self) -> None:
        squad = FakeFacts()
        for mid, start in (("m1", SEPTEMBER), ("m0", AUGUST)):
            for cohort in (Cohort.SQUAD, Cohort.OPPONENT):
                squad.matches.append(match_fact(match_id=mid, started_at=start, cohort=cohort))
                squad.rounds += [
                    round_fact(match_id=mid, started_at=start, cohort=cohort, round_index=i, won=(i % 3 == 0) == (cohort is Cohort.SQUAD),
                               side=Side.ATTACK if i < 12 else Side.DEFENSE)
                    for i in range(24)
                ]  # fmt: skip
            squad.player_rounds += [player_round(match_id=mid, started_at=start, round_index=i, won=i % 3 == 0) for i in range(24)]
            squad.player_matches.append(player_match(match_id=mid, started_at=start))
        top = FakeFacts(matches=[match_fact(match_id="t1", cohort=Cohort.TOP)])
        top.rounds = [round_fact(match_id="t1", cohort=Cohort.TOP, round_index=i, won=i % 2 == 0) for i in range(24)]
        top.player_rounds = [player_round(match_id="t1", cohort=Cohort.TOP, round_index=i) for i in range(24)]
        top.player_matches = [player_match(match_id="t1", cohort=Cohort.TOP)]
        self._squad, self._top = squad, top

    def squad(self) -> FakeFacts:
        return self._squad

    def top(self) -> FakeFacts:
        return self._top

    def maps(self) -> dict[str, Any]:
        return {"Ascent": None}


@pytest.fixture(scope="module")
def client() -> TestClient:
    app = FastAPI()
    register_error_handlers(app)
    app.include_router(report_insights.router, prefix="/api")
    store = FakeStore()
    app.state.facts_store = store
    app.state.report_service = ReportService(store)  # type: ignore[arg-type]
    return TestClient(app)


def test_findings_report_shape(client: TestClient) -> None:
    body = client.get("/api/report/findings", params={"month": "2026-09"}).json()
    assert body["q"] == 0.1
    assert body["tests"] > 0
    assert set(body["bonusRound"]) >= {"squad", "opp", "top", "hist", "pValue", "lostCauses", "rewatch"}


def test_detections_trends_and_distributions(client: TestClient) -> None:
    detections = client.get("/api/report/detections", params={"month": "2026-09"}).json()
    assert set(detections) == {"repetitions", "links"}

    trends = client.get("/api/report/trends", params={"month": "2026-09"}).json()
    assert [p["key"] for p in trends["byMonth"]] == ["2026-08", "2026-09"]
    assert [p["inPeriod"] for p in trends["byMonth"]] == [False, True]
    rounds_won = next(m for m in trends["metrics"] if m["key"] == "roundsWon")
    assert rounds_won["top"] is None  # symmetric metric: no top ranked reference
    assert len(trends["series"]) == 2

    distributions = client.get("/api/report/distributions", params={"month": "2026-09"}).json()
    assert distributions[0]["key"] == "firstKillTime"
    assert distributions[0]["squad"]["n"] == 24


def test_unknown_period_is_404(client: TestClient) -> None:
    assert client.get("/api/report/findings", params={"month": "2020-01"}).status_code == 404


def test_distributions_narrow_to_one_side(client: TestClient) -> None:
    params = {"month": "2026-09"}
    attack = client.get("/api/report/distributions", params={**params, "side": "att"}).json()
    defense = client.get("/api/report/distributions", params={**params, "side": "def"}).json()
    assert attack[0]["squad"]["n"] == 12
    assert defense[0]["squad"]["n"] == 12
    assert client.get("/api/report/distributions", params={**params, "side": "mid"}).status_code == 422


def test_distributions_reject_an_unknown_map(client: TestClient) -> None:
    params = {"month": "2026-09"}
    assert client.get("/api/report/distributions", params={**params, "map": "Ascent"}).json()[0]["squad"]["n"] == 24
    assert client.get("/api/report/distributions", params={**params, "map": "Nowhere"}).status_code == 404
