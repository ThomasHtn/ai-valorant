"""Minimap of one map for the period: where the squad dies, kills and plants, by side, with a summary per zone.

Layers are seen from the squad's side: on attack, its deaths as attackers, its kills on defenders, its
plants; on defense, the same as defenders and the opponents' plants.
"""

from collections import Counter, defaultdict
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass, field
from datetime import date

from valostats.analysis.report.foundation.cohorts import FactKind, ReportCohort, ReportCohorts
from valostats.analysis.report.foundation.death_rules import is_isolated
from valostats.analysis.report.rounds.round_lines import evening_days
from valostats.constants.rounds import MAX_ZONE_REFS, MINIMAP_DECIMALS
from valostats.domain.enums import Side
from valostats.domain.facts import KillFact, Location, RoundFact
from valostats.domain.maps import GameMap
from valostats.schemas.report.minimap import (
    Callout,
    MapPoint,
    MinimapLayers,
    MinimapSide,
    MinimapView,
    PlantPoint,
    PlayerCount,
    ZoneRef,
    ZoneRow,
    ZoneSummary,
)


@dataclass
class _Projector:
    """Turns game positions into minimap points and counts the ones Henrik placed off the map."""

    game_map: GameMap
    days: Mapping[str, date]
    out_of_map: int = 0

    def xy(self, at: Location | None) -> tuple[float, float] | None:
        if at is None:
            return None
        x, y = self.game_map.to_minimap(at)
        if not (0 <= x <= 1 and 0 <= y <= 1):
            self.out_of_map += 1
            return None
        return round(x, MINIMAP_DECIMALS), round(y, MINIMAP_DECIMALS)

    def death(self, kill: KillFact) -> MapPoint | None:
        """A squad death at the victim's position."""
        return self._point(kill, kill.victim_location, kill.victim, kill.killer, kill.victim_zone)

    def kill(self, kill: KillFact) -> MapPoint | None:
        """A squad kill at the killer's position."""
        return self._point(kill, kill.killer_location, kill.killer, kill.victim, kill.killer_zone)

    def killer_spot(self, kill: KillFact) -> MapPoint | None:
        """Where the opponent stood when he killed a squad player."""
        return self._point(kill, kill.killer_location, kill.victim, kill.killer, kill.killer_zone)

    def plant(self, fact: RoundFact, squad_plant: bool) -> PlantPoint | None:
        point = self.xy(fact.plant_location)
        if point is None:
            return None
        return PlantPoint(
            x=point[0],
            y=point[1],
            site=fact.plant_site,
            planter=fact.planter,
            squad_plant=squad_plant,
            won=fact.won,
            match_id=fact.match_id,
            round_number=fact.round_index + 1,
            day=self.days.get(fact.match_id, fact.started_at.date()),
        )

    def _point(self, kill: KillFact, at: Location | None, player: str, other: str, zone: str | None) -> MapPoint | None:
        point = self.xy(at)
        if point is None:
            return None
        return MapPoint(
            x=point[0],
            y=point[1],
            player=player,
            other=other,
            weapon=kill.weapon,
            zone=zone,
            avenged=kill.avenged,
            match_id=kill.match_id,
            round_number=kill.round_index + 1,
            day=self.days.get(kill.match_id, kill.started_at.date()),
        )


def minimap_view(cohorts: ReportCohorts, game_map: GameMap) -> MinimapView:
    name = game_map.name
    matches = [*cohorts.select(FactKind.MATCHES, ReportCohort.HISTORY), *cohorts.squad(FactKind.MATCHES)]
    projector = _Projector(game_map, evening_days(matches))
    deaths = cohorts.squad(FactKind.DEATHS, map_name=name)
    kills = cohorts.squad(FactKind.KILLS, map_name=name)
    rounds = cohorts.squad(FactKind.ROUNDS, map_name=name)
    top_first_deaths = [k for k in cohorts.select(FactKind.DEATHS, ReportCohort.TOP, map_name=name) if k.opening]
    sides = {
        side: _side(
            projector,
            side,
            [k for k in deaths if k.victim_side is side],
            [k for k in kills if k.victim_side is side.opposite],
            [r for r in rounds if r.side is side],
            [k for k in top_first_deaths if k.victim_side is side],
        )
        for side in Side
    }
    callouts = []
    for c in game_map.callouts:
        x, y = game_map.to_minimap(Location(c.x, c.y))
        callouts.append(Callout(name=c.name, x=round(x, MINIMAP_DECIMALS), y=round(y, MINIMAP_DECIMALS)))
    return MinimapView(map_name=name, minimap_url=game_map.minimap_url, callouts=callouts, sides=sides, out_of_map=projector.out_of_map)


def _side(
    projector: _Projector,
    side: Side,
    deaths: Sequence[KillFact],
    kills: Sequence[KillFact],
    rounds: Sequence[RoundFact],
    top_first_deaths: Sequence[KillFact],
) -> MinimapSide:
    layers = MinimapLayers(
        first_deaths=_keep(projector.death(k) for k in deaths if k.opening),
        first_bloods=_keep(projector.kill(k) for k in kills if k.opening),
        deaths=_keep(projector.death(k) for k in deaths),
        kills=_keep(projector.kill(k) for k in kills),
        plants=_keep(projector.plant(r, squad_plant=side is Side.ATTACK) for r in rounds if r.planted),
        isolated_deaths=_keep(projector.death(k) for k in deaths if is_isolated(k)),
        enemy_killer_spots=_keep(projector.killer_spot(k) for k in deaths),
        rounds=len(rounds),
    )
    return MinimapSide(layers=layers, zones=_zones(deaths, kills, top_first_deaths, projector.days))


@dataclass
class _Zone:
    first_deaths: list[KillFact] = field(default_factory=list)
    deaths: list[KillFact] = field(default_factory=list)
    kills: int = 0


def _zones(
    deaths: Sequence[KillFact], kills: Sequence[KillFact], top_first_deaths: Sequence[KillFact], days: Mapping[str, date]
) -> ZoneSummary:
    zones: defaultdict[str, _Zone] = defaultdict(_Zone)
    for k in deaths:
        zones[k.victim_zone].deaths.append(k)
        if k.opening:
            zones[k.victim_zone].first_deaths.append(k)
    for k in kills:
        if k.killer_zone:
            zones[k.killer_zone].kills += 1
    squad_first = sum(len(z.first_deaths) for z in zones.values())
    top_by_zone = Counter(k.victim_zone for k in top_first_deaths)
    # Zones where only the top ranked die first still get a row, for the comparison column.
    for zone in top_by_zone:
        zones.setdefault(zone, _Zone())
    rows = [
        ZoneRow(
            zone=zone,
            first_deaths=len(z.first_deaths),
            deaths=len(z.deaths),
            kills=z.kills,
            revenge_rate=round(sum(k.avenged for k in z.deaths) / len(z.deaths), 3) if z.deaths else None,
            revenge_sample=len(z.deaths),
            players=[PlayerCount(name=n, deaths=c) for n, c in Counter(k.victim for k in z.deaths).most_common()],
            first_death_share=round(len(z.first_deaths) / squad_first, 3) if squad_first else None,
            top_first_death_share=round(top_by_zone[zone] / len(top_first_deaths), 3) if top_first_deaths else None,
            refs=_refs(z, days),
        )
        for zone, z in zones.items()
    ]
    rows.sort(key=lambda r: (-r.first_deaths, -r.deaths, r.zone))
    return ZoneSummary(first_deaths=squad_first, top_first_deaths=len(top_first_deaths), rows=rows)


def _refs(zone: _Zone, days: Mapping[str, date]) -> list[ZoneRef]:
    """Rounds to rewatch in a zone: first deaths first, newest first."""
    newest = sorted(zone.deaths, key=lambda k: (not k.opening, -k.started_at.timestamp(), -k.round_index))
    return [
        ZoneRef(
            match_id=k.match_id,
            round_number=k.round_index + 1,
            day=days.get(k.match_id, k.started_at.date()),
            player=k.victim,
            first_death=k.opening,
        )
        for k in newest[:MAX_ZONE_REFS]
    ]


def _keep[T](points: Iterable[T | None]) -> list[T]:
    return [p for p in points if p is not None]
