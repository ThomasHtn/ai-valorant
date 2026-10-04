"""Report core: cohorts split, metric helpers, cells with references, table builder."""

from collections.abc import Sequence
from typing import Any

import pytest

from tests.report_facts import AUGUST, kill_fact, match_fact, player_match, player_round, round_fact
from valostats.analysis.report.foundation.cells import cell, count, fixed, mean, median, player_cell, ratio, sum_ratio
from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohort, ReportCohorts, build_cohorts, build_index
from valostats.analysis.report.foundation.period_selection import PeriodQuery, resolve
from valostats.analysis.report.foundation.table_builder import TableBuilder
from valostats.domain.enums import Cohort, KillerCohort, Reference, Side
from valostats.schemas.report.tables import ValueFormat


def make_cohorts(
    rounds: Sequence[Any] = (),
    kills: Sequence[Any] = (),
    player_rounds: Sequence[Any] = (),
    player_matches: Sequence[Any] = (),
    matches: Sequence[Any] = (),
    top_rounds: Sequence[Any] = (),
    top_player_rounds: Sequence[Any] = (),
) -> ReportCohorts:
    all_matches = list(matches) or [match_fact(), match_fact(match_id="old", started_at=AUGUST)]
    window = resolve(PeriodQuery(month="2026-09"), [m.started_at for m in all_matches], [m.patch for m in all_matches])
    facts = {
        FactKind.MATCHES: all_matches,
        FactKind.ROUNDS: list(rounds),
        FactKind.KILLS: list(kills),
        FactKind.PLAYER_ROUNDS: list(player_rounds),
        FactKind.PLAYER_MATCHES: list(player_matches),
    }
    top = build_index([], top_rounds, [], top_player_rounds, [], Cohort.TOP)
    return build_cohorts(window, facts, top)


def test_cohorts_split_period_history_and_opponents() -> None:
    cohorts = make_cohorts(
        rounds=[
            round_fact(),
            round_fact(cohort=Cohort.OPPONENT, won=False),
            round_fact(match_id="old", started_at=AUGUST, won=False),
        ],
        top_rounds=[round_fact(cohort=Cohort.TOP)],
    )
    assert len(cohorts.select(FactKind.ROUNDS, ReportCohort.SQUAD)) == 1
    assert len(cohorts.select(FactKind.ROUNDS, ReportCohort.OPPONENTS)) == 1
    assert [r.match_id for r in cohorts.select(FactKind.ROUNDS, ReportCohort.HISTORY)] == ["old"]
    assert len(cohorts.select(FactKind.ROUNDS, ReportCohort.TOP)) == 1


def test_kills_are_seen_from_both_sides_without_teamkills_or_environment() -> None:
    cohorts = make_cohorts(
        kills=[
            kill_fact(),  # squad kills an opponent
            kill_fact(killer_cohort=KillerCohort.OPPONENT, victim_cohort=Cohort.SQUAD),
            kill_fact(killer_cohort=KillerCohort.SQUAD, victim_cohort=Cohort.SQUAD, teamkill=True),
            kill_fact(killer_cohort=KillerCohort.ENVIRONMENT, victim_cohort=Cohort.SQUAD),
        ]
    )
    assert len(cohorts.squad(FactKind.KILLS)) == 1
    assert len(cohorts.squad(FactKind.DEATHS)) == 1
    assert len(cohorts.select(FactKind.DEATHS, ReportCohort.OPPONENTS)) == 1


def test_select_filters_on_fields_and_is_memoised() -> None:
    cohorts = make_cohorts(rounds=[round_fact(), round_fact(map_name="Split"), round_fact(map_name="Split", side=Side.DEFENSE)])
    split = cohorts.squad(FactKind.ROUNDS, map_name="Split")
    assert len(split) == 2
    assert cohorts.squad(FactKind.ROUNDS, map_name="Split") is split
    assert len(cohorts.squad(FactKind.ROUNDS, map_name="Split", side=Side.DEFENSE)) == 1
    assert cohorts.squad(FactKind.ROUNDS, map_name="Lotus") == []


def test_metric_helpers() -> None:
    rounds = [
        round_fact(won=True, first_kill_ms=10_000),
        round_fact(won=False, first_kill_ms=None),
        round_fact(won=True, first_kill_ms=30_000),
    ]
    assert ratio(lambda r: r.won)(rounds) == (2 / 3, 3)
    assert ratio(lambda r: r.won, lambda r: r.first_kill_ms is not None)(rounds) == (1.0, 2)
    assert mean(lambda r: r.first_kill_ms)(rounds) == (20_000, 2)
    assert median(lambda r: r.first_kill_ms)(rounds) == (20_000, 2)
    assert sum_ratio(lambda r: r.last_event_ms)(rounds) == (40_000, 3)
    assert count(lambda r: r.won)(rounds) == (2.0, 3)
    assert ratio(lambda r: r.won)([]) == (None, 0)


def test_cell_carries_every_reference_with_its_sample() -> None:
    cohorts = make_cohorts(
        rounds=[round_fact(), round_fact(won=False), round_fact(cohort=Cohort.OPPONENT, won=False)],
        top_rounds=[round_fact(cohort=Cohort.TOP), round_fact(cohort=Cohort.TOP, won=False)],
    )
    c = cell(cohorts, FactKind.ROUNDS, ratio(lambda r: r.won))
    assert (c.v, c.n) == (0.5, 2)
    assert (c.top, c.top_n) == (0.5, 2)
    assert (c.opp, c.opp_n) == (0.0, 1)
    assert (c.hist, c.hist_n) == (None, 0)


def test_player_cell_compares_with_the_same_role_and_the_player_himself() -> None:
    cohorts = make_cohorts(
        player_rounds=[
            player_round(),
            player_round(name="Bravo", puuid="bravo", agent="Omen", score=100),
            player_round(cohort=Cohort.OPPONENT, name="Zulu", agent="Reyna", score=300),
            player_round(cohort=Cohort.OPPONENT, name="Yankee", agent="Viper", score=50),
            player_round(match_id="old", started_at=AUGUST, score=150),
        ],
        player_matches=[player_match()],
    )
    alpha = cohorts.player("Alpha")
    assert alpha is not None and alpha.role == "Duelist"
    c = player_cell(cohorts, FactKind.PLAYER_ROUNDS, sum_ratio(lambda p: p.score), alpha)
    assert c.v == 200 and c.opp == 300 and c.hist == 150


def test_fixed_cell_and_rounding() -> None:
    assert fixed("12-15").v == "12-15"
    cohorts = make_cohorts(rounds=[round_fact(), round_fact(won=False), round_fact(won=False)])
    assert cell(cohorts, FactKind.ROUNDS, ratio(lambda r: r.won)).v == pytest.approx(0.3333)


def test_table_builder() -> None:
    table = (
        TableBuilder("t", "Titre", "Carte", help="roundsWon")
        .column("rw", "Rounds gagnés", ref=Reference.HISTORY)
        .count_column("n", "Matchs")
        .row("Ascent", "Ascent", {"rw": fixed(0.5, 10), "n": fixed(3)})
        .build()
    )
    assert table.columns[1].format is ValueFormat.INTEGER and table.columns[1].ref is Reference.NONE
    dumped = table.model_dump(by_alias=True)
    assert dumped["rowsLabel"] == "Carte"
    assert dumped["rows"][0]["cells"]["rw"] == {
        "v": 0.5,
        "n": 10,
        "top": None,
        "topN": None,
        "opp": None,
        "oppN": None,
        "hist": None,
        "histN": None,
        "ref": None,
    }
