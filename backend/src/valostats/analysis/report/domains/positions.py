"""Domain "Positions": kills and deaths by zone, engagement distances, zones the opponents kill from.

Zones are the callout closest to a position (killer's position for a kill, victim's for a death).
Facing ("morts prises de dos") is left out: the victim's view is only known from an older snapshot,
so the figure mostly measured the age of that snapshot.
"""

from collections import Counter
from collections.abc import Callable

from valostats.analysis.report.foundation.art import map_art
from valostats.analysis.report.foundation.cells import Measure, Metric, cell, fixed, median, ratio
from valostats.analysis.report.foundation.cohort_cell import cohort_cell
from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohort, ReportCohorts, SquadPlayer
from valostats.analysis.report.foundation.kill_roles import group_by_role
from valostats.analysis.report.foundation.table_builder import TableBuilder
from valostats.constants.agents import ROLE_LABELS
from valostats.constants.game import UNITS_PER_METRE
from valostats.constants.positions import CONTACT_ZONES, LONG_RANGE_M, MIN_ZONE_EVENTS, MIN_ZONE_SAMPLE, SHORT_RANGE_M
from valostats.domain.enums import Reference, Side
from valostats.domain.facts import KillFact
from valostats.schemas.report.tables import StatCell, StatTable, ValueFormat

SIDE_LABELS = {Side.ATTACK: "attaque", Side.DEFENSE: "défense"}


def tables(cohorts: ReportCohorts) -> list[StatTable]:
    return [_zones(cohorts), _distances(cohorts), _contact_zones(cohorts)]


def metres(kill: KillFact) -> float | None:
    return kill.distance / UNITS_PER_METRE if kill.distance is not None else None


def _zones(cohorts: ReportCohorts) -> StatTable:
    table = (
        TableBuilder("positions-zones", "Kills et morts par zone", "Carte · côté · zone", help="zoneKd")
        .count_column("kills", "Kills")
        .count_column("deaths", "Morts")
        .column("kd", "K/M", ValueFormat.DECIMAL_2, help="zoneKd", min=MIN_ZONE_SAMPLE)
        .column("fd", "Part des first deaths", better=-1, help="zoneFirstDeaths", min=MIN_ZONE_SAMPLE)
    )
    for map_name in cohorts.maps():
        for side in Side:
            # Our kills from a zone are seen from the killer: the victim was on the other side.
            kills = Counter(
                k.killer_zone for k in cohorts.squad(FactKind.KILLS, map_name=map_name, victim_side=side.opposite) if k.killer_zone
            )
            deaths = Counter(k.victim_zone for k in cohorts.squad(FactKind.DEATHS, map_name=map_name, victim_side=side))
            zones = [z for z in kills.keys() | deaths.keys() if kills[z] + deaths[z] >= MIN_ZONE_EVENTS]
            for zone in sorted(zones, key=lambda z: (-deaths[z], -kills[z], z)):
                table.row(
                    f"{map_name}-{side.value}-{zone}",
                    f"{map_name} · {SIDE_LABELS[side]} · {zone}",
                    {
                        "kills": fixed(kills[zone]),
                        "deaths": fixed(deaths[zone]),
                        "kd": _zone_kd(cohorts, map_name, side, zone),
                        "fd": cell(
                            cohorts,
                            FactKind.DEATHS,
                            ratio(lambda k: k.opening),
                            map_name=map_name,
                            victim_side=side,
                            victim_zone=zone,
                        ),
                    },
                    art=map_art(map_name),
                )
    return table.build()


def _zone_kd(cohorts: ReportCohorts, map_name: str, side: Side, zone: str) -> StatCell:
    """Kills made from the zone over deaths suffered in it; the sample is both together."""

    def measure(cohort: ReportCohort) -> Measure:
        kills = len(cohorts.select(FactKind.KILLS, cohort, map_name=map_name, victim_side=side.opposite, killer_zone=zone))
        deaths = len(cohorts.select(FactKind.DEATHS, cohort, map_name=map_name, victim_side=side, victim_zone=zone))
        return (kills / deaths if deaths else None), kills + deaths

    return cohort_cell(measure)


def _distances(cohorts: ReportCohorts) -> StatTable:
    table = TableBuilder("positions-distance", "Distance d'engagement", "Joueur", help="engageDistance")
    bands = (
        ("short", "courte", 0.0, float(SHORT_RANGE_M)),
        ("mid", "moyenne", float(SHORT_RANGE_M), float(LONG_RANGE_M)),
        ("long", "longue", float(LONG_RANGE_M), float("inf")),
    )
    for prefix, noun in (("k", "Kills"), ("d", "Morts")):
        for key, label, _, _ in bands:
            table.column(f"{prefix}_{key}", f"{noun} à distance {label}", better=0, help="engageDistance")
    table.column("med", "Distance médiane des kills", ValueFormat.METRES, 0, help="killDistance")

    # Kills and deaths of each reference cohort by role, so a player's references are a lookup.
    by_role = {
        (kind, cohort): group_by_role(cohorts, kind, cohort)
        for kind in (FactKind.KILLS, FactKind.DEATHS)
        for cohort in (ReportCohort.TOP, ReportCohort.OPPONENTS)
    }
    for player in cohorts.players():
        cells: dict[str, StatCell] = {}
        for key, _, low, high in bands:
            in_band = ratio(_within(low, high), lambda k: k.distance is not None)
            cells[f"k_{key}"] = _role_cell(cohorts, by_role, FactKind.KILLS, player, in_band)
            cells[f"d_{key}"] = _role_cell(cohorts, by_role, FactKind.DEATHS, player, in_band)
        cells["med"] = _role_cell(cohorts, by_role, FactKind.KILLS, player, median(metres))
        table.row(player.name, player.name, cells, sub=ROLE_LABELS.get(player.role, player.role))
    return table.build()


def _within(low: float, high: float) -> Callable[[KillFact], bool]:
    """Kills whose distance, in metres, is in [low, high)."""
    return lambda k: (m := metres(k)) is not None and low <= m < high


def _role_cell(
    cohorts: ReportCohorts,
    by_role: dict[tuple[FactKind, ReportCohort], dict[str, list[KillFact]]],
    kind: FactKind,
    player: SquadPlayer,
    metric: Metric,
) -> StatCell:
    """A metric on the player's kills (KILLS) or deaths (DEATHS): top and opp are players of his role, hist is himself."""

    def own(kill: KillFact) -> bool:
        return (kill.killer if kind is FactKind.KILLS else kill.victim) == player.name

    def measure(cohort: ReportCohort) -> Measure:
        if cohort in (ReportCohort.SQUAD, ReportCohort.HISTORY):
            return metric([k for k in cohorts.select(kind, cohort) if own(k)])
        return metric(by_role[(kind, cohort)].get(player.role, []))

    return cohort_cell(measure)


def _contact_zones(cohorts: ReportCohorts) -> StatTable:
    table = TableBuilder("positions-contact", "Zones d'où les adversaires tuent l'escouade", "Carte · côté", help="contactZones")
    for i in range(1, CONTACT_ZONES + 1):
        table.column(f"z{i}", f"Zone {i}", ValueFormat.TEXT, 0, ref=Reference.NONE, min=0)
    table.column("top", f"Top {CONTACT_ZONES} en top ranked", ValueFormat.TEXT, 0, ref=Reference.NONE, min=0)
    for map_name in cohorts.maps():
        for side in Side:
            ours = [k for k in cohorts.squad(FactKind.DEATHS, map_name=map_name, victim_side=side) if k.killer_zone]
            top = [k for k in cohorts.select(FactKind.DEATHS, ReportCohort.TOP, map_name=map_name, victim_side=side) if k.killer_zone]
            zones = Counter(k.killer_zone for k in ours)
            cells = {
                f"z{i}": fixed(f"{zone} · {round(100 * n / len(ours))} %", n)
                for i, (zone, n) in enumerate(zones.most_common(CONTACT_ZONES), start=1)
            }
            top_zones = Counter(k.killer_zone for k in top).most_common(CONTACT_ZONES)
            cells["top"] = fixed(", ".join(str(z) for z, _ in top_zones), len(top))
            table.row(
                f"{map_name}-{side.value}",
                f"{map_name} · {SIDE_LABELS[side]}",
                cells,
                art=map_art(map_name),
                sub=f"{len(ours)} morts",
            )
    return table.build()
