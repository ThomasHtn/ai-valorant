"""Domain "Combat": consistency of the ACS, value of kills."""

from tests.report_cohorts import make_cohorts
from tests.report_facts import kill_fact, player_match, round_fact
from valostats.analysis.report.domains import combat
from valostats.domain.enums import BuyType


def test_acs_spread_needs_enough_matches() -> None:
    two = [player_match(match_id=f"m{i}", score=200 * 22) for i in range(2)]
    assert combat.acs_spread(two) == (None, 2)
    three = [player_match(match_id=f"m{i}", score=s * 22) for i, s in enumerate((180, 200, 220))]
    spread, matches = combat.acs_spread(three)
    assert matches == 3 and spread is not None and round(spread, 2) == 16.33


def test_kill_value_reads_the_victims_buy_and_leaves_pistols_out() -> None:
    cohorts = make_cohorts(
        player_matches=[player_match()],
        rounds=[
            round_fact(round_index=3, opp_buy=BuyType.ECO),
            round_fact(round_index=4, opp_buy=BuyType.FULL),
            round_fact(round_index=0, opp_buy=BuyType.PISTOL),
        ],
        kills=[kill_fact(round_index=3), kill_fact(round_index=4), kill_fact(round_index=0)],
    )
    value = next(t for t in combat.tables(cohorts) if t.id == "combat-kill-value")
    cells = value.rows[0].cells
    assert cells["eco"].v == 0.5 and cells["eco"].n == 2
    assert cells["full"].v == 0.5
