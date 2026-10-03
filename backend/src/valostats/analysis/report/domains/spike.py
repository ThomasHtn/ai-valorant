"""Domain "Spike": plants and retakes by site, plants by map, post-plant by numbers at the plant, planters."""

from collections.abc import Callable
from typing import Any

from valostats.analysis.report.domains._lookups import planters, player_role_cell
from valostats.analysis.report.domains._players import player_art, role_label
from valostats.analysis.report.foundation.art import map_art
from valostats.analysis.report.foundation.cells import cell, fixed, mean, median, ratio
from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohorts
from valostats.analysis.report.foundation.table_builder import TableBuilder
from valostats.constants.timings import MS_PER_SECOND
from valostats.domain.enums import BuyType, Side
from valostats.domain.facts import PlayerRoundFact, RoundFact
from valostats.schemas.report.tables import StatTable, ValueFormat

RoundFilter = Callable[[RoundFact], bool]

# Plants on one site are a small sample: colour from 10.
MIN_SITE_SAMPLE = 10
# A player plants a few times per match: colour his survival from 5 plants.
MIN_PLANTER_SAMPLE = 5

# Players alive at the plant, own minus opponents', in buckets: (key, label, test on the difference).
ADVANTAGE_BUCKETS: tuple[tuple[str, str, Callable[[int], bool]], ...] = (
    ("down", "En infériorité", lambda a: a < 0),
    ("even", "À égalité", lambda a: a == 0),
    ("up1", "+1", lambda a: a == 1),
    ("up2", "+2 ou plus", lambda a: a >= 2),
)


def tables(cohorts: ReportCohorts) -> list[StatTable]:
    return [_by_site(cohorts), _by_map(cohorts), _by_advantage(cohorts), _by_player(cohorts)]


def _won(r: RoundFact) -> bool:
    return r.won


def _attack(r: RoundFact) -> bool:
    return r.side is Side.ATTACK


def _defense(r: RoundFact) -> bool:
    return r.side is Side.DEFENSE


def _attack_with_a_buy(r: RoundFact) -> bool:
    """Attack rounds that can be expected to reach a site: every buy but eco."""
    return _attack(r) and r.buy is not BuyType.ECO


def _sites(cohorts: ReportCohorts, map_name: str) -> list[str]:
    """Sites where the spike was planted in the squad's rounds on this map, alphabetical."""
    return sorted({r.plant_site for r in cohorts.squad(FactKind.ROUNDS, map_name=map_name) if r.plant_site})


def _by_site(cohorts: ReportCohorts) -> StatTable:
    table = (
        TableBuilder("spike-sites", "Plants et retakes par site", "Site", help="spikeSitePlants")
        .column("plants", "Vos plants", better=0, help="spikeSitePlants", min=MIN_SITE_SAMPLE)
        .column("postplant", "Post-plants gagnés", help="spikePostPlantWon", min=MIN_SITE_SAMPLE)
        .column("taken", "Plants subis", better=0, help="spikeSiteTaken", min=MIN_SITE_SAMPLE)
        .column("retake", "Retakes réussies", help="spikeRetakeWon", min=MIN_SITE_SAMPLE)
        .count_column("defuses", "Defuses", help="spikeDefuses")
        .column("adv", "Écart de joueurs au plant", ValueFormat.DECIMAL_1, help="spikeAdvAtPlant", min=MIN_SITE_SAMPLE)
    )
    for map_name in cohorts.maps():
        for site in _sites(cohorts, map_name):

            def at_site(r: RoundFact, site: str = site) -> bool:
                return r.plant_site == site

            def attack_here(r: RoundFact, site: str = site) -> bool:
                return _attack(r) and r.plant_site == site

            def defense_here(r: RoundFact, site: str = site) -> bool:
                return _defense(r) and r.plant_site == site

            defended = [r for r in cohorts.squad(FactKind.ROUNDS, map_name=map_name) if defense_here(r)]
            table.row(
                f"{map_name}-{site}",
                f"{map_name} · {site}",
                {
                    "plants": cell(cohorts, FactKind.ROUNDS, ratio(at_site, lambda r: _attack(r) and r.planted), map_name=map_name),
                    "postplant": cell(cohorts, FactKind.ROUNDS, ratio(_won, attack_here), map_name=map_name),
                    "taken": cell(cohorts, FactKind.ROUNDS, ratio(at_site, lambda r: _defense(r) and r.planted), map_name=map_name),
                    "retake": cell(cohorts, FactKind.ROUNDS, ratio(_won, defense_here), map_name=map_name),
                    "defuses": fixed(sum(r.defused for r in defended), len(defended)),
                    "adv": cell(cohorts, FactKind.ROUNDS, mean(lambda r: r.advantage_at_plant, attack_here), map_name=map_name),
                },
                art=map_art(map_name),
            )
    return table.build()


def _by_map(cohorts: ReportCohorts) -> StatTable:
    table = (
        TableBuilder("spike-maps", "Plants par carte", "Carte", help="spikePlantRate")
        .column("rate", "Rounds d'attaque avec plant", help="spikePlantRate")
        # The plant time is a style, not a quality: never coloured.
        .column("time", "Temps médian du plant", ValueFormat.SECONDS, 0, help="spikePlantTime", min=MIN_SITE_SAMPLE)
        .count_column("timeout", "Attaques perdues au temps", help="spikeTimeout")
        .count_column("exploded", "Explosions subies en défense", help="spikeExploded")
    )

    def add_row(key: str, label: str, total: bool = False, **equal: Any) -> None:
        rounds = cohorts.squad(FactKind.ROUNDS, **equal)
        attacks = [r for r in rounds if _attack(r)]
        defenses = [r for r in rounds if _defense(r)]
        table.row(
            key,
            label,
            {
                "rate": cell(cohorts, FactKind.ROUNDS, ratio(lambda r: r.planted, _attack_with_a_buy), **equal),
                "time": cell(
                    cohorts,
                    FactKind.ROUNDS,
                    median(lambda r: r.plant_ms / MS_PER_SECOND if r.plant_ms is not None else None, _attack),
                    **equal,
                ),
                "timeout": fixed(sum(r.timeout for r in attacks), len(attacks)),
                "exploded": fixed(sum(r.result == "Detonate" for r in defenses), len(defenses)),
            },
            art=map_art(label) if not total else None,
            total=total,
        )

    for map_name in cohorts.maps():
        add_row(map_name, map_name, map_name=map_name)
    add_row("all", "Toutes les cartes", total=True)
    return table.build()


def _by_advantage(cohorts: ReportCohorts) -> StatTable:
    # Advantage at the plant is stored from each team's point of view: for the defense it is already
    # the defenders' numbers minus the attackers'.
    table = (
        TableBuilder("spike-advantage", "Post-plant et retake selon l'écart au plant", "Écart au plant", help="spikeAdvAtPlant")
        .column("postplant", "Post-plants gagnés", help="spikePostPlantWon", min=MIN_SITE_SAMPLE)
        .column("retake", "Retakes réussies", help="spikeRetakeWon", min=MIN_SITE_SAMPLE)
    )
    for key, label, test in ADVANTAGE_BUCKETS:

        def in_bucket(r: RoundFact, test: Callable[[int], bool] = test) -> bool:
            return r.advantage_at_plant is not None and test(r.advantage_at_plant)

        table.row(
            key,
            label,
            {
                "postplant": cell(cohorts, FactKind.ROUNDS, ratio(_won, lambda r: _attack(r) and in_bucket(r))),
                "retake": cell(cohorts, FactKind.ROUNDS, ratio(_won, lambda r: _defense(r) and in_bucket(r))),
            },
        )
    return table.build()


def _by_player(cohorts: ReportCohorts) -> StatTable:
    table = (
        TableBuilder("spike-players", "Plants et defuses par joueur", "Joueur", help="spikePlayerPlants")
        .count_column("plants", "Plants", help="spikePlayerPlants")
        .count_column("defuses", "Defuses", help="spikePlayerDefuses")
        .column("survive", "Survie après son plant", help="spikePlanterSurvival", min=MIN_PLANTER_SAMPLE)
    )
    planted = planters(cohorts)

    def survived_plant(p: PlayerRoundFact) -> bool:
        return p.survived

    def planted_this_round(p: PlayerRoundFact) -> bool:
        return (p.match_id, p.round_index, p.name) in planted

    rounds = cohorts.squad(FactKind.ROUNDS)
    for player in cohorts.players():
        own = cohorts.squad(FactKind.PLAYER_ROUNDS, name=player.name)
        attacks = sum(1 for p in own if p.side is Side.ATTACK)
        defenses = len(own) - attacks
        table.row(
            player.name,
            player.name,
            {
                "plants": fixed(sum(1 for r in rounds if r.planter == player.name), attacks),
                "defuses": fixed(sum(1 for r in rounds if r.defuser == player.name), defenses),
                "survive": player_role_cell(cohorts, FactKind.PLAYER_ROUNDS, ratio(survived_plant, planted_this_round), player),
            },
            art=player_art(player),
            sub=role_label(player),
        )
    return table.build()
