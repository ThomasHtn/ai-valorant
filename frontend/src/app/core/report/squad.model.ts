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

/** One player in a squad situation, against the top ranked of his role. */
export interface SituationPlayer {
  name: string;
  portrait: string;
  role: string;
  k: number;
  n: number;
  top: number | null;
  /** Rounds won (+) or lost (-) against a top ranked player of the role on the same n. */
  cost: number | null;
}

/** A situation the squad keeps meeting, over every map and map by map. */
export interface Situation {
  key: string;
  label: string;
  /** What is counted: 'rounds gagnés après un first blood pour nous'. */
  detail: string;
  group: SituationGroup;
  gap: Gap;
  maps: MapGap[];
  /** Player by player, for the situations a single player decides (opening duels); empty otherwise. */
  players: SituationPlayer[];
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

/** A squad player; each cell's top ranked reference is every top ranked player, whatever the role. */
export interface RosterLine {
  name: string;
  portrait: string;
  matches: number;
  acs: StatCell;
  adr: StatCell;
  kast: StatCell;
  headshots: StatCell;
  opening: StatCell;
  /** First bloods and first deaths: '14-13'. */
  openingRecord: string;
  traded: StatCell;
  /** ACS month by month, aligned with `SquadView.months`; null when he did not play that month. */
  acsMonths: (number | null)[];
}

/** Headline rates of the squad before the period (its history). */
export interface KpisBefore {
  wins: Rate;
  rounds: Rate;
  firstDuels: Rate;
  pistols: Rate;
}

/** One month of the squad, for the month-by-month charts. */
export interface MonthPoint {
  /** '2026-09'. */
  month: string;
  /** 'Septembre'. */
  label: string;
  matches: number;
  rounds: Rate;
  firstDuels: Rate;
  pistols: Rate;
  duelDefense: Rate;
}

export interface SquadKpis {
  wins: Rate;
  rounds: Gap;
  firstDuels: Gap;
  pistols: Gap;
  /** Lost rounds the squad had a 70 % chance of winning at some point. */
  turning: number;
  lost: number;
  before: KpisBefore;
}

export interface SquadView {
  kpis: SquadKpis;
  /** The last months up to the period's end, oldest first. */
  months: MonthPoint[];
  situations: Situation[];
  maps: MapLine[];
  postPlant: SiteLine[];
  retakes: SiteLine[];
  roster: RosterLine[];
}
