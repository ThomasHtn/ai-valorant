from valostats.analysis.session.narrative import DeathAfterPeak, PlantAfterPeak, clock, explain, join_french
from valostats.domain.enums import Side


def death(name: str, spot: str, ms: int, killer: str = "B1", alone_versus: int = 0) -> DeathAfterPeak:
    return DeathAfterPeak(name, spot, ms, killer, revenge=False, alone_versus=alone_versus)


def test_clock_and_french_join():
    assert clock(83_400) == "1:23"
    assert join_french(["A", "B", "C"]) == "A, B et C"


def test_three_deaths_at_the_same_spot_tell_the_story_on_attack():
    deaths = [death("R1", "A Main", 10_000), death("R2", "A Main", 12_000), death("R3", "A Main", 15_000)]
    headline, notes = explain(Side.ATTACK, None, deaths, "Elimination", planted_at_peak=False)
    assert headline == "Entrée qui tourne mal à A Main"
    assert notes[0] == "R1, R2 et R3 meurent tous à A Main, en 5 s."
    assert notes[-1] == "Fin du round : toute l'équipe est éliminée."


def test_a_planted_peak_is_a_lost_post_plant_and_the_last_alone_player_lost_the_clutch():
    plant = PlantAfterPeak(ours=True, site="B", time="1:10", state_before="4v3", advantage_before=1)
    headline, notes = explain(Side.ATTACK, plant, [death("R5", "B Site", 90_000, alone_versus=2)], "Defuse", planted_at_peak=True)
    assert headline == "Post-plant perdu"
    assert "R5 se retrouve en 1v2 et perd le clutch." in notes
    assert notes[-1] == "Fin du round : l'adversaire defuse."
