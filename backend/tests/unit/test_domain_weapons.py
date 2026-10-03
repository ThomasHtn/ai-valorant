"""Domain "Armes": kill buckets, kills with a picked-up gun."""

import pytest

from tests.report_cohorts import make_cohorts
from tests.report_facts import kill_fact, player_match, player_round
from valostats.analysis.report.domains import weapons
from valostats.analysis.report.domains._lookups import kill_bucket
from valostats.domain.enums import KillMeans


def test_unnamed_weapon_kills_are_abilities() -> None:
    # Henrik leaves Chamber and Neon ultimates unnamed.
    assert kill_bucket(kill_fact(means=KillMeans.WEAPON, weapon=None)) == "Compétences"
    assert kill_bucket(kill_fact(means=KillMeans.MELEE, weapon="Melee")) == "Couteau"
    assert kill_bucket(kill_fact(weapon="Vandal")) == "Vandal"


def test_a_picked_up_gun_is_a_primary_other_than_the_one_bought() -> None:
    cohorts = make_cohorts(
        kills=[kill_fact(weapon="Operator"), kill_fact(round_index=4, weapon="Vandal"), kill_fact(round_index=5, weapon="Ghost")],
        player_rounds=[player_round(round_index=i, weapon="Vandal") for i in (3, 4, 5)],
        player_matches=[player_match()],
    )
    habits = next(t for t in weapons.tables(cohorts) if t.id == "weapons-habits")
    pickup = habits.rows[0].cells["pickup"]
    # Only the Operator kill: the Vandal was bought, a Ghost is a sidearm anyone can carry.
    assert pickup.v == pytest.approx(1 / 3, abs=1e-3)
    assert pickup.n == 3
