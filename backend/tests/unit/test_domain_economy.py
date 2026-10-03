"""Domain "Économie": a player's buy against his team's, pistol loadouts."""

from tests.report_cohorts import make_cohorts
from tests.report_facts import player_match, player_round, round_fact
from valostats.analysis.report.domains import economy
from valostats.domain.enums import BuyType
from valostats.schemas.report.tables import StatTable


def _table(tables: list[StatTable], table_id: str) -> StatTable:
    return next(t for t in tables if t.id == table_id)


def test_buy_mismatch_compares_the_players_loadout_with_his_teams_buy() -> None:
    cohorts = make_cohorts(
        rounds=[round_fact(buy=BuyType.FULL), round_fact(round_index=4, buy=BuyType.ECO, loadout=900.0)],
        # A full buy with the team, then a full buy alone while the team saves.
        player_rounds=[player_round(loadout=4500), player_round(round_index=4, loadout=4500)],
        player_matches=[player_match()],
    )
    mismatch = _table(economy.tables(cohorts), "eco-players").rows[0].cells["mismatch"]
    assert (mismatch.v, mismatch.n) == (0.5, 2)


def test_pistol_weapons_come_from_the_first_round_of_each_half() -> None:
    cohorts = make_cohorts(
        player_rounds=[
            player_round(round_index=0, weapon="Ghost"),
            player_round(round_index=12, weapon="Classic", won=False),
            player_round(round_index=3, weapon="Vandal"),
        ]
    )
    ghost = next(r for r in _table(economy.tables(cohorts), "eco-pistol-weapon").rows if r.key == "Ghost")
    assert (ghost.cells["share"].v, ghost.cells["share"].n) == (0.5, 2)
    assert ghost.cells["rw"].v == 1.0
