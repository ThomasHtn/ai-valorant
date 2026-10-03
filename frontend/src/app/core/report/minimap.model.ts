import { Side } from '@core/common/enums.model';

/** Mirrors `backend/src/valostats/schemas/report/minimap.py`; positions are minimap points from 0 to 1. */

export interface MinimapCallout {
  name: string;
  x: number;
  y: number;
}

/** A kill or a death of the squad: `player` is the squad player, `other` the opponent. */
export interface MapPoint {
  x: number;
  y: number;
  player: string;
  other: string;
  weapon: string | null;
  zone: string | null;
  /** Death avenged by a teammate (deaths) or kill avenged by the opponents (kills). */
  avenged: boolean;
  matchId: string;
  roundNumber: number;
  day: string;
}

export interface PlantPoint {
  x: number;
  y: number;
  site: string | null;
  planter: string | null;
  /** Plant made by the squad (attack) or by the opponents (squad on defense). */
  squadPlant: boolean;
  /** Round won by the squad. */
  won: boolean;
  matchId: string;
  roundNumber: number;
  day: string;
}

export interface MinimapLayers {
  firstDeaths: MapPoint[];
  firstBloods: MapPoint[];
  deaths: MapPoint[];
  kills: MapPoint[];
  plants: PlantPoint[];
  isolatedDeaths: MapPoint[];
  enemyKillerSpots: MapPoint[];
  rounds: number;
}

export interface ZoneRef {
  matchId: string;
  roundNumber: number;
  day: string;
  player: string;
  firstDeath: boolean;
}

export interface ZoneRow {
  zone: string;
  firstDeaths: number;
  deaths: number;
  kills: number;
  revengeRate: number | null;
  revengeSample: number;
  players: { name: string; deaths: number }[];
  /** Share of the side's first deaths in this zone, squad and top ranked. */
  firstDeathShare: number | null;
  topFirstDeathShare: number | null;
  refs: ZoneRef[];
}

export interface ZoneSummary {
  firstDeaths: number;
  topFirstDeaths: number;
  rows: ZoneRow[];
}

export interface MinimapSide {
  layers: MinimapLayers;
  zones: ZoneSummary;
}

/** One square of a density grid: its centre and how many points fall in it. */
export interface DensityCell {
  x: number;
  y: number;
  count: number;
}

export interface MinimapView {
  mapName: string;
  minimapUrl: string;
  callouts: MinimapCallout[];
  sides: Partial<Record<Side, MinimapSide>>;
  /** Points dropped because Henrik placed them outside the map. */
  outOfMap: number;
  /** Where the top ranked plant on this map, busiest cells first (same on both sides). */
  topPlants: DensityCell[];
}
