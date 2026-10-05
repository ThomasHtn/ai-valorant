/** Escouade view (`GET /report/squad`): what the squad wins and loses against the top ranked, in rounds. */

import { Rate } from './rate.model';
import { StatCell } from './stat-table.model';

/** `k` successes out of `n` for the squad, against the top ranked rate in the same situation. */
export interface Gap {
  k: number;
  n: number;
  top: number | null;
  topN: number;
  /** Rounds won (+) or lost (-) against a top ranked team on the same n: k - n * top. */
  rounds: number | null;
}

export interface MapGap {
  mapName: string;
  gap: Gap;
}

export type SituationGroup = 'opening' | 'economy' | 'spike';

/** A situation the squad keeps meeting, over every map and map by map. */
export interface Situation {
  key: string;
  label: string;
  /** What is counted: 'rounds gagnés après un first blood pour nous'. */
  detail: string;
  group: SituationGroup;
  gap: Gap;
  maps: MapGap[];
}

export interface MapLine {
  mapName: string;
  matches: number;
  wins: number;
  attack: Gap;
  defense: Gap;
}

/** Post-plant or retake on one site of one map. */
export interface SiteLine {
  mapName: string;
  site: string;
  gap: Gap;
}

/** A squad player; each cell's top ranked reference is players of his main role. */
export interface RosterLine {
  name: string;
  portrait: string;
  role: string;
  matches: number;
  acs: StatCell;
  adr: StatCell;
  kast: StatCell;
  headshots: StatCell;
  opening: StatCell;
  /** First bloods and first deaths: '14-13'. */
  openingRecord: string;
  traded: StatCell;
}

export interface SquadKpis {
  wins: Rate;
  rounds: Gap;
  firstDuels: Gap;
  pistols: Gap;
  /** Lost rounds the squad had a 70 % chance of winning at some point. */
  turning: number;
  lost: number;
}

export interface SquadView {
  kpis: SquadKpis;
  situations: Situation[];
  maps: MapLine[];
  postPlant: SiteLine[];
  retakes: SiteLine[];
  roster: RosterLine[];
}
