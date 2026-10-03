"""Domain "Utilitaire": casts per round from match totals."""

import pytest

from tests.report_cohorts import make_cohorts
from tests.report_facts import player_match
from valostats.analysis.report.domains import utility


def test_team_casts_per_round_count_each_round_once() -> None:
    # Five players, 22 rounds, 10 + 20 + 15 ability casts each.
    cohorts = make_cohorts(player_matches=[player_match(puuid=f"p{i}", name=f"P{i}") for i in range(5)])
    results = next(t for t in utility.tables(cohorts) if t.id == "utility-results")
    won = next(r for r in results.rows if r.key == "won").cells["cqe"]
    assert won.v == pytest.approx(5 * 45 / 22, abs=1e-3)
    assert won.n == 22
