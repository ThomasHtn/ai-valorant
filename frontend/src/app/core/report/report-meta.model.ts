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
  /** Avatar agent picked in ValoQuests, else the most played agent. */
  portrait: string;
  /** Role of the main agent, as Data Dragon names it ('Duelist'...). */
  role: string;
}

/** Top ranked matches behind the reference of one map of the pool. */
export interface MapReference {
  mapName: string;
  matches: number;
  /** Matches the collection aims for per map and patch. */
  quota: number;
  /** Too few matches yet: the map's figures are not compared. */
  collecting: boolean;
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
  /** Each map of the current pool, with the top ranked matches behind its reference. */
  referenceMaps: MapReference[];
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
  /** Maps of the pool played in the period, alphabetical. */
  maps: string[];
  /** Current competitive map pool: every figure of the report is limited to it. */
  mapPool: string[];
  /** Matches of the period on maps out of the pool, left out of the figures. */
  offPoolMatches: number;
  /** Alphabetical. */
  players: MetaPlayer[];
  quality: DataQuality;
}
