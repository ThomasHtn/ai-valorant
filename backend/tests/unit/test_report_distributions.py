"""Distribution view narrowed to one map and one side."""

from tests.report_facts import kill_fact, player_round, round_fact
from valostats.analysis.report.insights.distributions import DistributionScope
from valostats.domain.enums import Side


def test_scope_keeps_every_fact_by_default() -> None:
    rounds = [round_fact(map_name="Split"), round_fact(map_name="Lotus", side=Side.DEFENSE)]
    assert DistributionScope().rounds(rounds) == rounds


def test_scope_narrows_rounds_and_player_rounds_to_map_and_side() -> None:
    split_attack = round_fact(map_name="Split", side=Side.ATTACK)
    split_defense = round_fact(map_name="Split", side=Side.DEFENSE)
    lotus_attack = round_fact(map_name="Lotus", side=Side.ATTACK)
    scope = DistributionScope(map_name="Split", side=Side.ATTACK)
    assert scope.rounds([split_attack, split_defense, lotus_attack]) == [split_attack]
    players = [player_round(map_name="Split", side=Side.DEFENSE), player_round(map_name="Split", side=Side.ATTACK)]
    assert scope.player_rounds(players) == [players[1]]


def test_scope_counts_a_kill_on_the_killer_side() -> None:
    # The victim defends, so the killer attacks.
    kill = kill_fact(victim_side=Side.DEFENSE)
    assert DistributionScope(side=Side.ATTACK).kills([kill]) == [kill]
    assert DistributionScope(side=Side.DEFENSE).kills([kill]) == []


def test_each_scope_has_its_own_cache_key() -> None:
    keys = {
        DistributionScope().cache_key,
        DistributionScope(map_name="Split").cache_key,
        DistributionScope(side=Side.ATTACK).cache_key,
        DistributionScope(map_name="Split", side=Side.ATTACK).cache_key,
    }
    assert len(keys) == 4
