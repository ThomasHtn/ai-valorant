"""Domain "Ouvertures": weapon rows, team conversions, players' opening balance."""

from tests.report_cohorts import make_cohorts
from tests.report_facts import kill_fact, player_match, player_round, round_fact
from valostats.analysis.report.domains import opening
from valostats.domain.enums import KillMeans


def test_abilities_and_unnamed_ultimates_share_one_weapon_row() -> None:
    assert opening.weapon_group(kill_fact(weapon="Vandal")) == "Vandal"
    assert opening.weapon_group(kill_fact(weapon=None, means=KillMeans.ABILITY)) == opening.ABILITIES_ROW
    assert opening.weapon_group(kill_fact(weapon="Melee", means=KillMeans.MELEE)) == opening.ABILITIES_ROW


def test_team_rates_count_only_rounds_with_an_opening_duel() -> None:
    cohorts = make_cohorts(
        rounds=[
            round_fact(first_kill=True),
            round_fact(round_index=4, first_kill=False, first_death_avenged=True),
            round_fact(round_index=5, first_kill=False, first_death_avenged=False, won=False),
            round_fact(round_index=6, first_kill=None),
        ]
    )
    side_table = next(t for t in opening.tables(cohorts) if t.id == "opening-side")
    attack = side_table.rows[0].cells
    assert attack["fb"].v == round(1 / 3, 4) and attack["fb"].n == 3
    assert attack["fdr"].v == 0.5
    assert attack["duels"].v == 3


def test_player_balance_is_first_bloods_minus_first_deaths() -> None:
    cohorts = make_cohorts(
        player_matches=[player_match()],
        player_rounds=[
            player_round(first_blood=True),
            player_round(round_index=4, first_blood=True),
            player_round(round_index=5, first_blood=False, first_death=True),
        ],
    )
    players = next(t for t in opening.tables(cohorts) if t.id == "opening-players")
    cells = players.rows[0].cells
    assert cells["net"].v == "+1"
    assert cells["duel"].v == round(2 / 3, 4)
