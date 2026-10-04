"""Domain "Armes": kills and deaths by weapon and class, the Operator, favourite weapons and habits of each player.

Kills are bucketed by `kill_bucket`: the gun's name, or "Compétences" (abilities and the unnamed
Chamber and Neon ultimates), "Couteau", "Autres". Shares and distances are counted once per cohort,
then every cell is a lookup.
"""

from collections import Counter, defaultdict
from collections.abc import Sequence
from typing import Any

from valostats.analysis.report.domains._lookups import (
    KillsByRole,
    cell_from_measures,
    every_fact,
    kill_bucket,
    measured_cell,
    player_facts,
)
from valostats.analysis.report.domains._players import player_art, role_label
from valostats.analysis.report.foundation.art import map_art, weapon_art
from valostats.analysis.report.foundation.cells import Measure, cell, fixed, mean, median, ratio
from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohort, ReportCohorts, SquadPlayer
from valostats.analysis.report.foundation.table_builder import TableBuilder
from valostats.constants.game import UNITS_PER_METRE
from valostats.constants.weapons import (
    ABILITY_LABEL,
    CLASS_OF_GUN,
    GUNS,
    KNIFE_LABEL,
    OPERATOR,
    OTHER_LABEL,
    SIDEARMS,
    WEAPON_CLASSES,
)
from valostats.domain.enums import Side
from valostats.domain.facts import KillFact, PlayerRoundFact
from valostats.schemas.report.tables import StatCell, StatTable, ValueFormat

# Distances and Operator figures rest on few events: colour from 10.
MIN_WEAPON_SAMPLE = 10
# Favourite weapons listed per player.
WEAPONS_PER_PLAYER = 3
OTHER_CLASS_LABEL = "Couteau et autres"
SIDES = ((Side.ATTACK, "attaque"), (Side.DEFENSE, "défense"))


def tables(cohorts: ReportCohorts) -> list[StatTable]:
    kills = {c: list(cohorts.select(FactKind.KILLS, c)) for c in ReportCohort}
    deaths = {c: list(cohorts.select(FactKind.DEATHS, c)) for c in ReportCohort}
    by_role = KillsByRole(cohorts)
    return [
        _by_weapon(cohorts, kills, deaths),
        _by_class(kills),
        _operator(cohorts),
        _by_player_weapon(cohorts, by_role),
        _habits(cohorts, by_role),
    ]


def _metres(kill: KillFact) -> float | None:
    return kill.distance / UNITS_PER_METRE if kill.distance is not None else None


def _share_cell(counts: dict[ReportCohort, Counter[str]], keys: Sequence[str]) -> StatCell:
    """Share of a cohort's kills (or deaths) whose bucket is in `keys`; the sample is every kill."""

    def share(counter: Counter[str]) -> Measure:
        total = counter.total()
        return (sum(counter[k] for k in keys) / total if total else None), total

    return cell_from_measures({cohort: share(counter) for cohort, counter in counts.items()})


def _headshot_rate(rounds: Sequence[PlayerRoundFact]) -> Measure:
    shots = sum(p.shots for p in rounds)
    return (sum(p.headshots for p in rounds) / shots if shots else None), len(rounds)


def _by_weapon(cohorts: ReportCohorts, kills: dict[ReportCohort, list[KillFact]], deaths: dict[ReportCohort, list[KillFact]]) -> StatTable:
    table = (
        TableBuilder("weapons-list", "Kills et morts par arme", "Arme", help="weaponKillShare")
        .column("kills", "Part des kills", better=0, help="weaponKillShare")
        .column("deaths", "Part des morts subies", better=0, help="weaponDeathShare")
        .column("hs", "HS % (rounds avec l'arme)", help="weaponHs", proportion=False)
        .column("dist", "Distance médiane des kills", ValueFormat.METRES, 0, help="weaponDistance", min=MIN_WEAPON_SAMPLE)
        .column("won", "Rounds gagnés avec l'arme", help="weaponRoundsWon")
    )
    kill_counts = {c: Counter(kill_bucket(k) for k in ks) for c, ks in kills.items()}
    death_counts = {c: Counter(kill_bucket(k) for k in ks) for c, ks in deaths.items()}
    distances: dict[ReportCohort, dict[str, list[float]]] = {}
    for cohort, ks in kills.items():
        grouped: dict[str, list[float]] = defaultdict(list)
        for k in ks:
            if (metres := _metres(k)) is not None:
                grouped[kill_bucket(k)].append(metres)
        distances[cohort] = dict(grouped)

    held = Counter(p.weapon for p in cohorts.squad(FactKind.PLAYER_ROUNDS))
    rows = [w for w in GUNS if kill_counts[ReportCohort.SQUAD][w] or held[w]] + [ABILITY_LABEL, KNIFE_LABEL]
    for weapon in rows:
        is_gun = weapon in CLASS_OF_GUN
        table.row(
            weapon,
            weapon,
            {
                "kills": _share_cell(kill_counts, [weapon]),
                "deaths": _share_cell(death_counts, [weapon]),
                "hs": cell(cohorts, FactKind.PLAYER_ROUNDS, _headshot_rate, weapon=weapon) if is_gun else fixed(None, 0),
                "dist": measured_cell(median(lambda d: d), {c: distances[c].get(weapon, []) for c in ReportCohort}),
                "won": cell(cohorts, FactKind.PLAYER_ROUNDS, ratio(lambda p: p.won), weapon=weapon) if is_gun else fixed(None, 0),
            },
            art=weapon_art(weapon) if is_gun else None,
        )
    return table.build()


def _by_class(kills: dict[ReportCohort, list[KillFact]]) -> StatTable:
    table = TableBuilder("weapons-classes", "Kills par type d'arme", "Type d'arme", help="weaponKillShare").column(
        "kills", "Part des kills", better=0, help="weaponKillShare"
    )
    counts = {c: Counter(kill_bucket(k) for k in ks) for c, ks in kills.items()}
    for key, label, guns in WEAPON_CLASSES:
        table.row(key, label, {"kills": _share_cell(counts, guns)})
    table.row("abilities", ABILITY_LABEL, {"kills": _share_cell(counts, [ABILITY_LABEL])})
    table.row("other", OTHER_CLASS_LABEL, {"kills": _share_cell(counts, [KNIFE_LABEL, OTHER_LABEL])})
    return table.build()


def _operator(cohorts: ReportCohorts) -> StatTable:
    table = (
        TableBuilder("weapons-operator", "Operator par carte et côté", "Carte et côté", help="weaponOperatorRounds")
        .column("rounds", "Rounds avec un Operator", better=0, help="weaponOperatorRounds")
        .column("kills", "Kills par round Operator", ValueFormat.DECIMAL_2, help="weaponOperatorKills", min=MIN_WEAPON_SAMPLE)
        .column("won", "Rounds gagnés avec un Operator", help="weaponOperatorWon", min=MIN_WEAPON_SAMPLE)
    )
    # Operator kills of every (match, round, killer), counted once for all cohorts.
    kills_by_round = Counter(
        (k.match_id, k.round_index, k.killer_puuid) for k in every_fact(cohorts, FactKind.KILLS) if k.weapon == OPERATOR
    )

    def operator_kills(p: PlayerRoundFact) -> float:
        return float(kills_by_round[(p.match_id, p.round_index, p.puuid)])

    def add_row(key: str, label: str, total: bool = False, **equal: Any) -> None:
        table.row(
            key,
            label,
            {
                "rounds": cell(cohorts, FactKind.PLAYER_ROUNDS, ratio(lambda p: p.weapon == OPERATOR), **equal),
                "kills": cell(cohorts, FactKind.PLAYER_ROUNDS, mean(operator_kills), weapon=OPERATOR, **equal),
                "won": cell(cohorts, FactKind.PLAYER_ROUNDS, ratio(lambda p: p.won), weapon=OPERATOR, **equal),
            },
            art=None if total else map_art(str(equal["map_name"])),
            total=total,
        )

    for map_name in cohorts.maps():
        for side, side_label in SIDES:
            add_row(f"{map_name}-{side.value}", f"{map_name} · {side_label}", map_name=map_name, side=side)
    add_row("all", "Toutes les cartes", total=True)
    return table.build()


def _player_kills(cohorts: ReportCohorts, player: SquadPlayer) -> list[KillFact]:
    return list(cohorts.squad(FactKind.KILLS, killer=player.name))


def _by_player_weapon(cohorts: ReportCohorts, by_role: KillsByRole) -> StatTable:
    table = (
        TableBuilder("weapons-players", "Armes favorites par joueur", "Joueur et arme", help="weaponPlayerKd")
        .count_column("kills", "Kills", help="weaponPlayerKills")
        .column("kd", "K/D avec l'arme", ValueFormat.DECIMAL_2, help="weaponPlayerKd")
        .column("dist", "Distance médiane", ValueFormat.METRES, 0, help="weaponDistance", min=MIN_WEAPON_SAMPLE)
    )
    for player in cohorts.players():
        own = _player_kills(cohorts, player)
        gun_kills = Counter(bucket for bucket in map(kill_bucket, own) if bucket in CLASS_OF_GUN)
        favourites = [w for w, _ in gun_kills.most_common(WEAPONS_PER_PLAYER)]
        for weapon in favourites:
            kills_with = by_role.of_player_with(player, weapon)
            held = player_facts(cohorts, FactKind.PLAYER_ROUNDS, player, weapon=weapon)
            table.row(
                f"{player.name}-{weapon}",
                f"{player.name} · {weapon}",
                {
                    "kills": fixed(len(kills_with[ReportCohort.SQUAD]), len(own)),
                    "kd": _kd_cell(kills_with, held),
                    "dist": measured_cell(median(_metres), kills_with),
                },
                art=weapon_art(weapon),
                sub=role_label(player),
            )
    return table.build()


def _kd_cell(kills_with: dict[ReportCohort, Sequence[KillFact]], held: dict[ReportCohort, Sequence[PlayerRoundFact]]) -> StatCell:
    """Kills with the weapon over deaths, both on the rounds it was bought (not picked up, not a sidearm); sample: those rounds."""

    def kd(cohort: ReportCohort) -> Measure:
        rounds = {(p.match_id, p.round_index, p.puuid) for p in held[cohort]}
        kills = sum((k.match_id, k.round_index, k.killer_puuid) in rounds for k in kills_with[cohort])
        deaths = sum(p.deaths for p in held[cohort])
        return (kills / deaths if deaths else None), len(held[cohort])

    return cell_from_measures({cohort: kd(cohort) for cohort in held})


def _habits(cohorts: ReportCohorts, by_role: KillsByRole) -> StatTable:
    table = (
        TableBuilder("weapons-habits", "Tir secondaire et armes ramassées", "Joueur", help="weaponSecondary")
        .count_column("kills", "Kills")
        .column("secondary", "Kills en tir secondaire", better=0, help="weaponSecondary")
        .column("pickup", "Kills avec une arme ramassée", better=0, help="weaponPickup")
    )
    # Weapon each player held at the end of the buy phase, to spot kills made with a picked-up gun.
    held = {(p.match_id, p.round_index, p.puuid): p.weapon for p in every_fact(cohorts, FactKind.PLAYER_ROUNDS)}

    def is_gun_kill(k: KillFact) -> bool:
        return kill_bucket(k) in CLASS_OF_GUN

    def picked_up(k: KillFact) -> bool:
        weapon = kill_bucket(k)
        return weapon in CLASS_OF_GUN and weapon not in SIDEARMS and weapon != held.get((k.match_id, k.round_index, k.killer_puuid))

    for player in cohorts.players():
        facts = by_role.of_player(player)
        table.row(
            player.name,
            player.name,
            {
                "kills": fixed(len(facts[ReportCohort.SQUAD]), len(facts[ReportCohort.SQUAD])),
                "secondary": measured_cell(ratio(lambda k: k.secondary_fire, is_gun_kill), facts),
                "pickup": measured_cell(ratio(picked_up), facts),
            },
            art=player_art(player),
            sub=role_label(player),
        )
    return table.build()
