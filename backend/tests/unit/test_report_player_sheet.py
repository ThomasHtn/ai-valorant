"""Player sheet and the positions, agents and context domains, on hand-made facts."""

from collections.abc import Sequence
from datetime import timedelta
from typing import Any

from tests.report_facts import AUGUST, SEPTEMBER, kill_fact, match_fact, player_match, player_round
from valostats.analysis.report.domains import agents, context, positions
from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohorts, build_cohorts, build_index
from valostats.analysis.report.foundation.period_selection import PeriodQuery, resolve
from valostats.analysis.report.players.player_sheet import player_sheet
from valostats.constants.agents import canonical_agent
from valostats.domain.enums import Cohort, KillerCohort, Side


def make_cohorts(
    matches: Sequence[Any] = (),
    kills: Sequence[Any] = (),
    player_rounds: Sequence[Any] = (),
    player_matches: Sequence[Any] = (),
    top_matches: Sequence[Any] = (),
    top_kills: Sequence[Any] = (),
    portraits: dict[str, str] | None = None,
) -> ReportCohorts:
    all_matches = list(matches) or [match_fact()]
    window = resolve(PeriodQuery(month="2026-09"), [m.started_at for m in all_matches], [m.patch for m in all_matches])
    facts = {
        FactKind.MATCHES: all_matches,
        FactKind.ROUNDS: [],
        FactKind.KILLS: list(kills),
        FactKind.PLAYER_ROUNDS: list(player_rounds),
        FactKind.PLAYER_MATCHES: list(player_matches) or [player_match()],
    }
    return build_cohorts(window, facts, build_index(top_matches, [], top_kills, [], [], Cohort.TOP), portraits)


def our_death(**changes: Any) -> Any:
    """Alpha (squad) killed by Zulu (opponent) at A Site, on defense."""
    return kill_fact(
        **{
            "killer": "Zulu",
            "killer_puuid": "zulu",
            "killer_team": "Blue",
            "killer_cohort": KillerCohort.OPPONENT,
            "victim": "Alpha",
            "victim_puuid": "alpha",
            "victim_team": "Red",
            "victim_cohort": Cohort.SQUAD,
            "victim_side": Side.DEFENSE,
            "victim_zone": "A Site",
            "killer_zone": "A Main",
            **changes,
        }
    )


def test_zone_kd_counts_kills_from_the_zone_on_the_killers_side() -> None:
    # Our kill from A Site while defending: the victim attacked.
    our_kill = kill_fact(killer_zone="A Site", victim_side=Side.ATTACK)
    deaths = [our_death(ms=1000 * i) for i in range(4)]
    cohorts = make_cohorts(kills=[our_kill, *deaths])
    zones = positions.tables(cohorts)[0]
    row = next(r for r in zones.rows if r.key == "Ascent-def-A Site")
    assert (row.cells["kills"].v, row.cells["deaths"].v) == (1, 4)
    assert row.cells["kd"].v == 0.25 and row.cells["kd"].n == 5


def test_contact_zones_rank_the_opponents_positions() -> None:
    deaths = [our_death(killer_zone="A Main"), our_death(killer_zone="A Main", ms=2), our_death(killer_zone="Mid", ms=3)]
    table = positions.tables(make_cohorts(kills=deaths))[2]
    row = next(r for r in table.rows if r.key == "Ascent-def")
    assert row.cells["z1"].v == "A Main · 67 %" and row.cells["z2"].v == "Mid · 33 %"


def test_role_split_and_compo_keys() -> None:
    assert agents.role_split(["Jett", "Sova", "Fade", "Omen", "Killjoy"]) == "1-2-1-1"
    assert agents.compo(["Sova", "Jett"]) == "Jett, Sova"


def test_opponent_level_buckets() -> None:
    weaker = match_fact(match_id="w", tier=15.0, opp_tier=12.0)
    same = match_fact(match_id="s", tier=15.0, opp_tier=16.0)
    stronger = match_fact(match_id="x", tier=15.0, opp_tier=18.0)
    assert [context.level_gap(m) for m in (weaker, same, stronger)] == [-3.0, 1.0, 3.0]
    table = next(t for t in context.tables(make_cohorts(matches=[weaker, same, stronger])) if t.id == "context-level")
    assert [(r.key, r.cells["matches"].v) for r in table.rows] == [("weaker", 1), ("same", 1), ("stronger", 1)]


def test_player_sheet_rewatch_keeps_first_deaths_without_revenge() -> None:
    deaths = [
        our_death(round_index=1, opening=True, avenged=False),
        our_death(round_index=2, opening=True, avenged=True, avenger="Bravo"),
        our_death(round_index=3, opening=False),
    ]
    sheet = player_sheet(make_cohorts(kills=deaths, player_rounds=[player_round()]), "Alpha")
    assert [r.round_number for r in sheet.rewatch] == [2]
    assert sheet.death_zones[0].deaths == 3 and sheet.death_zones[0].first_deaths == 2


def test_player_sheet_form_spans_history_and_flags_the_period() -> None:
    old = match_fact(match_id="old", started_at=AUGUST)
    new = match_fact(match_id="new", started_at=SEPTEMBER + timedelta(days=1))
    cohorts = make_cohorts(
        matches=[old, new],
        player_rounds=[player_round(match_id="new", started_at=new.started_at, kills=2), player_round(match_id="old", started_at=AUGUST)],
        player_matches=[player_match(match_id="new", started_at=new.started_at), player_match(match_id="old", started_at=AUGUST)],
    )
    form = player_sheet(cohorts, "Alpha").form
    assert [(f.match_id, f.in_period, f.kills) for f in form] == [("old", False, 1), ("new", True, 2)]


def test_valoquests_portrait_replaces_the_most_played_agent_but_not_the_role() -> None:
    assert make_cohorts().players()[0].portrait == "Jett"
    player = make_cohorts(portraits={"alpha": "Neon"}).players()[0]
    assert (player.portrait, player.role) == ("Neon", "Duelist")
    assert make_cohorts(portraits={"alpha": "Omen"}).players()[0].role == "Duelist"


def test_canonical_agent_matches_valoquests_spelling() -> None:
    assert canonical_agent("neon") == "Neon"
    assert canonical_agent("kay/o") == "KAY/O"
    assert canonical_agent("default") is None
    assert canonical_agent(None) is None
