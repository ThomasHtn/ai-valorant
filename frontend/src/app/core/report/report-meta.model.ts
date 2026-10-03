/** What a report covers (`GET /report/meta`): header facts, filter options, data quality. */

/** How the period was chosen. */
export type PeriodKind = 'month' | 'patch' | 'range' | 'session';

export interface PatchCount {
  patch: string;
  matches: number;
}

/** A squad player of the period, with the agent he played most (his picture in tables). */
export interface MetaPlayer {
  name: string;
  puuid: string;
  mainAgent: string;
  /** Role of the main agent, as Data Dragon names it ('Duelist'...). */
  role: string;
}

/** What the figures rest on, shown under the filters. */
export interface DataQuality {
  completeMatches: number;
  incompleteMatches: number;
  /** Distinct five-player lineups. */
  lineups: number;
  topMatches: number;
  topPatches: string[];
  /** Maps of the period without top ranked games: no top reference there. */
  mapsWithoutTop: string[];
}

export interface ReportMeta {
  key: string;
  title: string;
  kind: PeriodKind;
  matches: number;
  wins: number;
  losses: number;
  rounds: number;
  sessions: number;
  patches: PatchCount[];
  /** Maps played in the period, alphabetical. */
  maps: string[];
  /** Alphabetical. */
  players: MetaPlayer[];
  quality: DataQuality;
}
