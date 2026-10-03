import { ValueFormat } from '@core/format/value-format.model';

/**
 * Tendance view (`GET /report/trends`), mirror of `backend/src/valostats/schemas/report/trends.py`.
 * The whole history is sent; `inPeriod` marks the points the report covers.
 */

/** A metric the analyst can plot. */
export interface TrendMetric {
  key: string;
  label: string;
  format: ValueFormat;
  /** 1 higher is better, -1 lower is better. */
  better: number;
  help: string | null;
  /** Top ranked value; null for symmetric metrics (always 50 % there). */
  top: number | null;
}

export interface TrendValue {
  v: number | null;
  /** Sample behind the value (rounds, deaths, player-rounds, shots). */
  n: number;
}

/** The squad over one month ('2026-09') or one patch ('13.06'). */
export interface TrendPoint {
  key: string;
  matches: number;
  wins: number;
  values: Record<string, TrendValue>;
  inPeriod: boolean;
}

export interface PlayerTrendPoint {
  key: string;
  values: Record<string, TrendValue>;
  inPeriod: boolean;
}

export interface PlayerTrend {
  name: string;
  role: string;
  /** Top ranked players of the same role, by metric key. */
  top: Record<string, number | null>;
  byMonth: PlayerTrendPoint[];
}

/** One squad match of the history, oldest first. */
export interface MatchPoint {
  index: number;
  matchId: string;
  day: string;
  mapName: string;
  patch: string;
  won: boolean;
  roundsWon: number;
  roundsLost: number;
  /** Player name -> ACS of the match. */
  acs: Record<string, number>;
  patchChange: boolean;
  inPeriod: boolean;
}

/** First match of a patch, by its index in `series`. */
export interface PatchMarker {
  index: number;
  patch: string;
  day: string;
}

export interface Trends {
  metrics: TrendMetric[];
  playerMetrics: TrendMetric[];
  byMonth: TrendPoint[];
  byPatch: TrendPoint[];
  players: PlayerTrend[];
  series: MatchPoint[];
  patchMarkers: PatchMarker[];
}
