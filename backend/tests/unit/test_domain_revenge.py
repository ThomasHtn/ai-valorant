"""Domain "Revenge et espacement": isolation, deaths in a row without revenge, duos."""

from tests.report_cohorts import make_cohorts
from tests.report_facts import kill_fact, player_match, player_round
from valostats.analysis.report.domains import revenge
from valostats.domain.enums import Cohort, KillerCohort

SQUAD_DEATH = {"victim_cohort": Cohort.SQUAD, "killer_cohort": KillerCohort.OPPONENT, "victim_team": "Red", "killer_team": "Blue"}


def test_a_death_is_isolated_beyond_15_metres_from_the_closest_teammate() -> None:
    assert revenge.is_isolated(kill_fact(nearest_teammate=1600.0))
    assert not revenge.is_isolated(kill_fact(nearest_teammate=1400.0))
    # The last player alive has no teammate: not counted as isolated.
    assert not revenge.is_isolated(kill_fact(nearest_teammate=None))


def test_double_peeks_are_unavenged_deaths_in_the_same_zone_within_5_seconds() -> None:
    first = kill_fact(ms=10_000, victim="Alpha", **SQUAD_DEATH)
    second = kill_fact(ms=13_000, victim="Bravo", **SQUAD_DEATH)
    elsewhere = kill_fact(ms=12_000, victim="Charlie", victim_zone="B Site", **SQUAD_DEATH)
    avenged = kill_fact(ms=11_000, victim="Delta", avenged=True, avenger="Echo", **SQUAD_DEATH)
    flagged = revenge.double_peeks([first, second, elsewhere, avenged])
    assert flagged == {id(first), id(second)}


def test_duos_count_revenges_between_the_two_players() -> None:
    players = [player_match(name=n, puuid=n.lower()) for n in ("Alpha", "Bravo")]
    rounds = [player_round(name=n, puuid=n.lower()) for n in ("Alpha", "Bravo")]
    kills = [kill_fact(victim="Alpha", avenged=True, avenger="Bravo", **SQUAD_DEATH)]
    cohorts = make_cohorts(player_matches=players, player_rounds=rounds, kills=kills)
    duos = next(t for t in revenge.tables(cohorts) if t.id == "revenge-duos")
    cells = duos.rows[0].cells
    assert cells["rounds"].v == 1
    assert cells["revs"].v == 1
    assert cells["won"].v == 1.0
