"""Domain "Timings": tempo of the rounds by map and side, plant tempo, when players die, survival over time.

Times are seconds since the start of the round. Tempo is a style, not a quality: those columns are
never coloured (better = 0) and only compared with the top ranked by reading.
"""

import bisect
from collections.abc import Callable
from typing import Any

from valostats.analysis.report.domains._lookups import kill_times_by_round, player_role_cell
from valostats.analysis.report.domains._players import player_art, role_label
from valostats.analysis.report.foundation.art import map_art
from valostats.analysis.report.foundation.cells import cell, fixed, median, ratio
from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohorts
from valostats.analysis.report.foundation.table_builder import TableBuilder
from valostats.constants.timings import (
    EARLY_DEATH_MS,
    FAST_PLANT_MS,
    LATE_DEATH_MS,
    LATE_PLANT_MS,
    MS_PER_SECOND,
    SURVIVAL_CHECKPOINTS_S,
)
from valostats.domain.enums import Side
from valostats.domain.facts import PlayerRoundFact, RoundFact
from valostats.schemas.report.tables import StatTable, ValueFormat

# Plants and times on one map and side rest on few rounds: colour from 10.
MIN_TIMING_SAMPLE = 10
SIDES = ((Side.ATTACK, "attaque"), (Side.DEFENSE, "défense"))

# (key, label, test on the plant time in ms)
PLANT_TEMPOS: tuple[tuple[str, str, Callable[[int], bool]], ...] = (
    ("fast", "Rapide (moins de 40 s)", lambda ms: ms < FAST_PLANT_MS),
    ("mid", "Moyen (40 à 70 s)", lambda ms: FAST_PLANT_MS <= ms <= LATE_PLANT_MS),
    ("late", "Tardif (plus de 70 s)", lambda ms: ms > LATE_PLANT_MS),
)


def _seconds(ms: int | None) -> float | None:
    return ms / MS_PER_SECOND if ms is not None else None


def tables(cohorts: ReportCohorts) -> list[StatTable]:
    return [_by_map_side(cohorts), _plant_tempo(cohorts), _death_timing(cohorts), _survival(cohorts), _plant_to_kill(cohorts)]


def _by_map_side(cohorts: ReportCohorts) -> StatTable:
    table = (
        TableBuilder("timings-maps", "Rythme des rounds par carte et côté", "Carte et côté", help="timingFirstKill")
        .column("fk", "Temps médian du premier kill", ValueFormat.SECONDS, 0, help="timingFirstKill")
        .column("plant", "Temps médian du plant", ValueFormat.SECONDS, 0, help="timingPlant", min=MIN_TIMING_SAMPLE)
        .column("length", "Durée médiane des rounds", ValueFormat.SECONDS, 0, help="timingRoundLength")
    )

    def add_row(key: str, label: str, side: Side, total: bool = False, **equal: Any) -> None:
        table.row(
            key,
            label,
            {
                "fk": cell(cohorts, FactKind.ROUNDS, median(lambda r: _seconds(r.first_kill_ms)), side=side, **equal),
                # Only the attack plants.
                "plant": cell(cohorts, FactKind.ROUNDS, median(lambda r: _seconds(r.plant_ms)), side=side, **equal)
                if side is Side.ATTACK
                else fixed(None, 0),
                "length": cell(cohorts, FactKind.ROUNDS, median(lambda r: _seconds(r.last_event_ms)), side=side, **equal),
            },
            art=None if total else map_art(str(equal["map_name"])),
            total=total,
        )

    for map_name in cohorts.maps():
        for side, side_label in SIDES:
            add_row(f"{map_name}-{side.value}", f"{map_name} · {side_label}", side, map_name=map_name)
    for side, side_label in SIDES:
        add_row(f"all-{side.value}", f"Toutes les cartes · {side_label}", side, total=True)
    return table.build()


def _plant_tempo(cohorts: ReportCohorts) -> StatTable:
    table = (
        TableBuilder("timings-plant-tempo", "Tempo du plant en attaque", "Tempo", help="timingPlantTempo")
        .column("share", "Part des plants", better=0, help="timingPlantTempo")
        .column("won", "Post-plants gagnés", help="timingPostPlantWon", min=MIN_TIMING_SAMPLE)
    )
    for key, label, test in PLANT_TEMPOS:

        def in_tempo(r: RoundFact, test: Callable[[int], bool] = test) -> bool:
            return r.plant_ms is not None and test(r.plant_ms)

        table.row(
            key,
            label,
            {
                "share": cell(cohorts, FactKind.ROUNDS, ratio(in_tempo, lambda r: r.planted), side=Side.ATTACK),
                "won": cell(cohorts, FactKind.ROUNDS, ratio(lambda r: r.won, in_tempo), side=Side.ATTACK),
            },
        )
    return table.build()


def _died(p: PlayerRoundFact) -> bool:
    return p.death_ms is not None


def _died_when(test: Callable[[int], bool]) -> Callable[[PlayerRoundFact], bool]:
    return lambda p: p.death_ms is not None and test(p.death_ms)


def _death_timing(cohorts: ReportCohorts) -> StatTable:
    table = (
        TableBuilder("timings-deaths", "Moment des morts par joueur", "Joueur", help="timingDeaths")
        .column("early", "Avant 20 s", better=0, help="timingDeaths")
        .column("mid", "Entre 20 et 60 s", better=0, help="timingDeaths")
        .column("late", "Après 60 s", better=0, help="timingDeaths")
    )
    buckets: dict[str, Callable[[int], bool]] = {
        "early": lambda ms: ms < EARLY_DEATH_MS,
        "mid": lambda ms: EARLY_DEATH_MS <= ms <= LATE_DEATH_MS,
        "late": lambda ms: ms > LATE_DEATH_MS,
    }
    for player in cohorts.players():
        cells = {
            key: player_role_cell(
                cohorts,
                FactKind.PLAYER_ROUNDS,
                ratio(_died_when(test), _died),
                player,
            )
            for key, test in buckets.items()
        }
        table.row(player.name, player.name, cells, art=player_art(player), sub=role_label(player))
    return table.build()


def _survival(cohorts: ReportCohorts) -> StatTable:
    table = (
        TableBuilder("timings-survival", "Joueurs encore en vie selon le temps", "Temps", help="timingSurvival")
        .column("att", "Attaque", help="timingSurvival")
        .column("def", "Défense", help="timingSurvival")
    )
    for seconds in SURVIVAL_CHECKPOINTS_S:
        limit = seconds * MS_PER_SECOND

        def alive(p: PlayerRoundFact, limit: int = limit) -> bool:
            return p.death_ms is None or p.death_ms > limit

        table.row(
            f"t{seconds}",
            f"À {seconds} s",
            {
                "att": cell(cohorts, FactKind.PLAYER_ROUNDS, ratio(alive), side=Side.ATTACK),
                "def": cell(cohorts, FactKind.PLAYER_ROUNDS, ratio(alive), side=Side.DEFENSE),
            },
        )
    return table.build()


def _plant_to_kill(cohorts: ReportCohorts) -> StatTable:
    table = (
        TableBuilder("timings-after-plant", "Délai entre le plant et le kill suivant", "Carte", help="timingAfterPlant")
        .column("own", "Après vos plants", ValueFormat.SECONDS, 0, help="timingAfterPlant", min=MIN_TIMING_SAMPLE)
        .column("opp", "Après les plants adverses", ValueFormat.SECONDS, 0, help="timingAfterPlant", min=MIN_TIMING_SAMPLE)
    )
    kill_times = kill_times_by_round(cohorts)

    def next_kill_after_plant(r: RoundFact) -> float | None:
        if r.plant_ms is None:
            return None
        times = kill_times.get((r.match_id, r.round_index), [])
        i = bisect.bisect_right(times, r.plant_ms)
        return (times[i] - r.plant_ms) / MS_PER_SECOND if i < len(times) else None

    def add_row(key: str, label: str, total: bool = False, **equal: Any) -> None:
        table.row(
            key,
            label,
            {
                "own": cell(cohorts, FactKind.ROUNDS, median(next_kill_after_plant), side=Side.ATTACK, **equal),
                "opp": cell(cohorts, FactKind.ROUNDS, median(next_kill_after_plant), side=Side.DEFENSE, **equal),
            },
            art=None if total else map_art(label),
            total=total,
        )

    for map_name in cohorts.maps():
        add_row(map_name, map_name, map_name=map_name)
    add_row("all", "Toutes les cartes", total=True)
    return table.build()
