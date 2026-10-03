"""Headline band of the player sheet: four figures every player is judged on, then four of his role.

An initiator is not judged on ACS alone: each role gets the figures that say whether he does his job
(duelist opens, initiator and controller set up the team, sentinel holds and survives). References follow
`cells.player_cell`: top ranked and opponents of the same main role, history is the player himself.
"""

from collections.abc import Callable
from dataclasses import dataclass

from valostats.analysis.report.foundation.cells import Metric, cell, player_cell, ratio, sum_ratio
from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohorts, SquadPlayer
from valostats.analysis.report.foundation.death_rules import has_living_teammate, is_isolated
from valostats.analysis.report.foundation.player_metrics import (
    acs,
    adr,
    fbfd_per_round,
    first_deaths_per_round,
    headshot_rate,
    kast,
    kd,
    opening_duels_won,
    revenge_rate,
    zero_damage_rate,
)
from valostats.constants.players import MIN_UTILITY_MATCHES
from valostats.constants.report import MIN_TEAM_SAMPLE
from valostats.schemas.report.player import HeadlineStat
from valostats.schemas.report.tables import StatCell, ValueFormat

# Sample units written under a tile ("Sur 445 rounds").
ROUNDS = "rounds"
DEATHS = "morts"
HITS = "balles"
DUELS = "duels"
MATCHES = "matchs"
CLUTCHES = "clutchs"

first_bloods_per_round: Metric = sum_ratio(lambda r: r.first_blood)
assists_per_round: Metric = sum_ratio(lambda r: r.assists)
revenges_given_per_round: Metric = sum_ratio(lambda r: r.revenge_given)
clutch_won: Metric = ratio(lambda r: r.clutch_won, lambda r: r.clutch_versus > 0)
# Abilities other than the ultimate, per round; on player-matches, so the sample is matches.
utility_per_round: Metric = sum_ratio(lambda m: m.grenade_casts + m.ability1_casts + m.ability2_casts, lambda m: m.rounds)
isolated_rate: Metric = ratio(is_isolated, has_living_teammate)

CellBuilder = Callable[[ReportCohorts, SquadPlayer], StatCell]


def _rounds(metric: Metric) -> CellBuilder:
    return lambda cohorts, player: player_cell(cohorts, FactKind.PLAYER_ROUNDS, metric, player)


def _matches(metric: Metric) -> CellBuilder:
    return lambda cohorts, player: player_cell(cohorts, FactKind.PLAYER_MATCHES, metric, player)


def _isolated(cohorts: ReportCohorts, player: SquadPlayer) -> StatCell:
    """Deaths have no agent field: the reference role comes from the agent the victim played in that match."""
    return cell(
        cohorts,
        FactKind.DEATHS,
        isolated_rate,
        where=lambda k: k.victim == player.name,
        reference_where=lambda k: cohorts.role_of_player(k.match_id, k.victim_puuid) == player.role,
        history_where=lambda k: k.victim == player.name,
    )


@dataclass(frozen=True)
class Tile:
    key: str
    label: str
    format: ValueFormat
    # 1 higher is better, -1 lower is better.
    better: int
    # Glossary key of the "i" tip.
    help: str
    unit: str
    build: CellBuilder
    # Sample under which the tile stays grey.
    min: int = MIN_TEAM_SAMPLE


COMMON: tuple[Tile, ...] = (
    Tile("acs", "ACS", ValueFormat.INTEGER, 1, "acs", ROUNDS, _rounds(acs)),
    Tile("kd", "K/D", ValueFormat.DECIMAL_2, 1, "kd", ROUNDS, _rounds(kd)),
    Tile("adr", "ADR", ValueFormat.INTEGER, 1, "adr", ROUNDS, _rounds(adr)),
    Tile("kast", "KAST", ValueFormat.PERCENT, 1, "kast", ROUNDS, _rounds(kast)),
)

FIRST_BLOODS = Tile(
    "fb", "First bloods par round", ValueFormat.DECIMAL_2, 1, "firstBloodsPerRound", ROUNDS, _rounds(first_bloods_per_round)
)
OPENING_WON = Tile("openingWon", "Premiers duels gagnés", ValueFormat.PERCENT, 1, "openingDuelsWon", DUELS, _rounds(opening_duels_won))
REVENGED = Tile("revenge", "Morts avec revenge", ValueFormat.PERCENT, 1, "deathsRevenged", DEATHS, _rounds(revenge_rate))
HEADSHOTS = Tile("hs", "HS", ValueFormat.PERCENT, 1, "hs", HITS, _rounds(headshot_rate))
ASSISTS = Tile("assists", "Assists par round", ValueFormat.DECIMAL_2, 1, "assistsPerRound", ROUNDS, _rounds(assists_per_round))
UTILITY = Tile(
    "utility",
    "Utilitaires par round",
    ValueFormat.DECIMAL_2,
    1,
    "playerUtilityPerRound",
    MATCHES,
    _matches(utility_per_round),
    MIN_UTILITY_MATCHES,
)
ZERO_DAMAGE = Tile("zeroDmg", "Morts à 0 dégât", ValueFormat.PERCENT, -1, "zeroDamageDeaths", DEATHS, _rounds(zero_damage_rate))
REVENGES_GIVEN = Tile(
    "given", "Revenges données par round", ValueFormat.DECIMAL_2, 1, "revengesGiven", ROUNDS, _rounds(revenges_given_per_round)
)
FIRST_DEATHS = Tile("fd", "First deaths par round", ValueFormat.DECIMAL_2, -1, "fdPerRound", ROUNDS, _rounds(first_deaths_per_round))
ISOLATED = Tile("isolated", "Morts isolées", ValueFormat.PERCENT, -1, "isolatedDeaths", DEATHS, _isolated)
CLUTCH = Tile("clutch", "Clutchs gagnés", ValueFormat.PERCENT, 1, "playerClutchWon", CLUTCHES, _rounds(clutch_won))
FBFD = Tile("fbfd", "FB-FD par round", ValueFormat.DECIMAL_2, 1, "fbfdPerRound", ROUNDS, _rounds(fbfd_per_round))

# What each role is for, keyed by the English role of `constants.agents`.
ROLE_TILES: dict[str, tuple[Tile, ...]] = {
    "Duelist": (FIRST_BLOODS, OPENING_WON, REVENGED, HEADSHOTS),
    "Initiator": (ASSISTS, UTILITY, REVENGES_GIVEN, ZERO_DAMAGE),
    "Controller": (ASSISTS, UTILITY, REVENGES_GIVEN, ISOLATED),
    "Sentinel": (FIRST_DEATHS, ISOLATED, CLUTCH, REVENGES_GIVEN),
}
# Unknown role (agent missing from the table): the figures every role shares.
DEFAULT_TILES: tuple[Tile, ...] = (HEADSHOTS, FBFD, REVENGED, ZERO_DAMAGE)


def headline(cohorts: ReportCohorts, player: SquadPlayer) -> list[HeadlineStat]:
    tiles = COMMON + ROLE_TILES.get(player.role, DEFAULT_TILES)
    return [
        HeadlineStat(
            key=t.key,
            label=t.label,
            format=t.format,
            better=t.better,
            help=t.help,
            unit=t.unit,
            min=t.min,
            cell=t.build(cohorts, player),
        )
        for t in tiles
    ]
