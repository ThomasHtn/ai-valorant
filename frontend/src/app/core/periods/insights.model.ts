import { MatchRecord, Rate } from '@core/common/common.model';

export interface DriverRow {
  label: string;
  squad: Rate;
  top: Rate;
}

/** Round win rate under conditions the team controls or lives through. */
export interface DriverGroup {
  title: string;
  rows: DriverRow[];
}

export interface StatCorrelation {
  label: string;
  r: number | null;
  matches: number;
}

export interface PlayerCorrelation {
  name: string;
  matches: number;
  r: number | null;
  winRateHighAcs: number | null;
  winRateLowAcs: number | null;
}

export interface Correlations {
  team: StatCorrelation[];
  players: PlayerCorrelation[];
}

export interface ContextRow {
  label: string;
  record: MatchRecord;
}

export interface PresenceRow {
  name: string;
  withPlayer: MatchRecord;
  withoutPlayer: MatchRecord;
}

export interface SessionsContext {
  byRankInEvening: ContextRow[];
  byStartHour: ContextRow[];
  byWeekday: ContextRow[];
  lineups: ContextRow[];
  presence: PresenceRow[];
}

export interface Composition {
  agents: string[];
  matches: number;
  wins: number;
}

export interface MapCompositions {
  mapName: string;
  squad: Composition[];
  topMostPlayed: string[] | null;
  topShare: Rate | null;
}

/** Rows: the player who died. Columns: the teammate who took the revenge (order of `names`). */
export interface RevengeMatrix {
  names: string[];
  counts: number[][];
  traded: Rate[];
}
