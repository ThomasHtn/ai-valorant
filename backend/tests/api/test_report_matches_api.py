"""Match, rounds and minimap endpoints on hand-made facts, without a database."""

from dataclasses import dataclass, field
from datetime import timedelta
from typing import Any

import pytest
from fastapi import APIRouter, FastAPI
from fastapi.testclient import TestClient

from tests.factories import TEST_MAP
from tests.report_facts import SEPTEMBER, kill_fact, match_fact, player_match, player_round, round_fact
from valostats.analysis.extraction.win_probability import WinProbabilityTable
from valostats.api.error_handlers import register_error_handlers
from valostats.api.routes import report_matches
from valostats.domain.enums import Cohort, KillerCohort, Side
from valostats.services.match_service import MatchService
from valostats.services.report_service import ReportService

PERIOD = {"month": "2026-09"}


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
    win_probability: WinProbabilityTable = field(default_factory=lambda: WinProbabilityTable([]))


class FakeStore:
    def __init__(self) -> None:
        squad = FakeFacts()
        for i, start in enumerate((SEPTEMBER, SEPTEMBER + timedelta(hours=1))):
            mid = f"m{i}"
            for cohort, team in ((Cohort.SQUAD, "Red"), (Cohort.OPPONENT, "Blue")):
                squad.matches.append(match_fact(match_id=mid, started_at=start, cohort=cohort, team_id=team))
                for r in range(2):
                    squad.rounds.append(round_fact(match_id=mid, started_at=start, cohort=cohort, team_id=team, round_index=r, won=r == 0))
            squad.player_rounds.append(player_round(match_id=mid, started_at=start))
            squad.player_matches.append(player_match(match_id=mid, started_at=start))
            squad.kills.append(kill_fact(match_id=mid, started_at=start, map_name="Ascent", victim_side=Side.DEFENSE))
            squad.kills.append(
                kill_fact(
                    match_id=mid, started_at=start, killer="Zulu", killer_cohort=KillerCohort.OPPONENT, killer_team="Blue",
                    victim="Alpha", victim_cohort=Cohort.SQUAD, victim_team="Red", victim_side=Side.ATTACK, round_index=1,
                )
            )  # fmt: skip
        self._squad, self._top = squad, FakeFacts(match_count=0)

    def squad(self) -> FakeFacts:
        return self._squad

    def top(self) -> FakeFacts:
        return self._top

    def maps(self) -> dict[str, Any]:
        return {"Ascent": TEST_MAP}


@pytest.fixture(scope="module")
def client() -> TestClient:
    app = FastAPI()
    register_error_handlers(app)
    api = APIRouter(prefix="/api")
    api.include_router(report_matches.router)
    app.include_router(api)
    store = FakeStore()
    app.state.report_service = ReportService(store)  # type: ignore[arg-type]
    app.state.match_service = MatchService(store, session_factory=None)  # type: ignore[arg-type]
    return TestClient(app)


def test_matches_grouped_by_evening(client: TestClient) -> None:
    body = client.get("/api/report/matches", params=PERIOD).json()
    assert len(body["evenings"]) == 1
    assert [m["matchId"] for m in body["evenings"][0]["matches"]] == ["m0", "m1"]
    first = body["evenings"][0]["matches"][0]
    assert first["lineup"][0]["name"] == "Alpha"
    assert first["openingWon"] + first["openingLost"] <= 2


def test_match_detail(client: TestClient) -> None:
    body = client.get("/api/report/matches/m0").json()
    assert body["squad"][0]["name"] == "Alpha"
    assert [r["roundNumber"] for r in body["rounds"]] == [1, 2]
    assert body["rounds"][1]["cause"] == "execute_failed"
    assert client.get("/api/report/matches/unknown").status_code == 404


def test_rounds_index_newest_first(client: TestClient) -> None:
    rounds = client.get("/api/report/rounds", params=PERIOD).json()["rounds"]
    assert [(r["matchId"], r["roundNumber"]) for r in rounds] == [("m1", 2), ("m1", 1), ("m0", 2), ("m0", 1)]
    assert rounds[0]["scoreBefore"] == "1-0"


def test_minimap(client: TestClient) -> None:
    body = client.get("/api/report/minimap/Ascent", params=PERIOD).json()
    attack = body["sides"]["att"]["layers"]
    assert len(attack["firstDeaths"]) == 2
    # The squad's kills on defenders are attack kills.
    assert len(attack["kills"]) == 2
    assert len(body["sides"]["def"]["layers"]["kills"]) == 0
    assert client.get("/api/report/minimap/Nowhere", params=PERIOD).status_code == 404
