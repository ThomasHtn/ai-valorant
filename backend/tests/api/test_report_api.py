"""Report endpoints on hand-made facts, without a database."""

from dataclasses import dataclass, field
from datetime import timedelta
from typing import Any

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from tests.report_facts import AUGUST, SEPTEMBER, match_fact, player_match, player_round, round_fact
from valostats.api.error_handlers import register_error_handlers
from valostats.api.router import api_router
from valostats.domain.enums import BuyType, Cohort, Side
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
    match_count: int = 0


class FakeStore:
    def __init__(self) -> None:
        squad = FakeFacts()
        # Two evenings in September (two matches 1 h apart, then one a week later) and one in August.
        starts = [SEPTEMBER, SEPTEMBER + timedelta(hours=1), SEPTEMBER + timedelta(days=7), AUGUST]
        for i, start in enumerate(starts):
            mid = f"m{i}"
            won = i != 1
            for cohort, team in ((Cohort.SQUAD, "Red"), (Cohort.OPPONENT, "Blue")):
                own = cohort is Cohort.SQUAD
                squad.matches.append(match_fact(match_id=mid, started_at=start, cohort=cohort, team_id=team, won=won == own))
                for r in range(4):
                    squad.rounds.append(
                        round_fact(
                            match_id=mid,
                            started_at=start,
                            cohort=cohort,
                            round_index=r,
                            won=(r % 2 == 0) == own,
                            side=Side.ATTACK if r < 2 else Side.DEFENSE,
                            buy=BuyType.PISTOL if r == 0 else BuyType.FULL,
                        )
                    )
            squad.player_rounds.append(player_round(match_id=mid, started_at=start))
            squad.player_matches.append(player_match(match_id=mid, started_at=start))
        top = FakeFacts(match_count=1)
        top.matches = [match_fact(match_id="t1", cohort=Cohort.TOP, map_name="Ascent")]
        top.rounds = [round_fact(match_id="t1", cohort=Cohort.TOP, won=w) for w in (True, False)]
        self._squad, self._top = squad, top

    def squad(self) -> FakeFacts:
        return self._squad

    def top(self) -> FakeFacts:
        return self._top

    def maps(self) -> dict[str, Any]:
        return {}


@pytest.fixture(scope="module")
def client() -> TestClient:
    app = FastAPI()
    register_error_handlers(app)
    app.include_router(api_router)
    app.state.report_service = ReportService(FakeStore())  # type: ignore[arg-type]
    return TestClient(app)


def test_periods_tree(client: TestClient) -> None:
    body = client.get("/api/report/periods").json()
    assert [m["key"] for m in body["months"]] == ["2026-09", "2026-08"]
    september = body["months"][0]
    assert september["matches"] == 3
    assert [s["matches"] for s in september["sessions"]] == [1, 2]
    assert september["sessions"][1]["scores"] == ["13-9", "13-9"]
    assert body["topMatches"] == 1 and body["patches"] == ["13.06"]


def test_meta(client: TestClient) -> None:
    body = client.get("/api/report/meta", params={"month": "2026-09"}).json()
    assert body["kind"] == "month" and body["title"] == "Septembre 2026"
    assert (body["matches"], body["wins"], body["losses"], body["rounds"], body["sessions"]) == (3, 2, 1, 12, 2)
    assert body["players"] == [{"name": "Alpha", "puuid": "alpha", "portrait": "Jett", "role": "Duelist"}]
    assert body["quality"]["incompleteMatches"] == 3  # 4 round facts for a 22-round match
    session = client.get("/api/report/meta", params={"start": "2026-09-17", "end": "2026-09-17"}).json()
    assert session["kind"] == "session" and session["matches"] == 1


def test_results_tables(client: TestClient) -> None:
    body = client.get("/api/report/tables/results", params={"month": "2026-09"}).json()
    assert body["key"] == "results" and body["label"] == "Résultats"
    by_map = body["tables"][0]
    assert by_map["id"] == "results-maps"
    total = by_map["rows"][-1]
    assert total["total"] and total["cells"]["rw"]["v"] == 0.5
    assert total["cells"]["rw"]["hist"] == 0.5
    assert by_map["columns"][2]["ref"] == "hist" and by_map["rows"][0]["art"] == {"type": "map", "slug": "ascent"}


def test_unknown_or_empty(client: TestClient) -> None:
    assert client.get("/api/report/tables/nope").status_code == 404
    assert client.get("/api/report/meta", params={"month": "2025-01"}).status_code == 404
    assert client.get("/api/report/meta", params={"month": "2026-09", "patch": "13.06"}).status_code == 422
