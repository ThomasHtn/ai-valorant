/** The report tree of the period switcher (`GET /report/periods`). */

/** One evening of squad matches. */
export interface SessionEntry {
  /** `YYYY-MM-DD`: a session report is the range `start = end = day`. */
  day: string;
  matches: number;
  wins: number;
  losses: number;
  /** Map of each match, in play order. */
  maps: string[];
  /** Score of each match, e.g. '13-11', same order as `maps`. */
  scores: string[];
  /** Patch of each match, same order as `maps`. */
  patches: string[];
}

export interface MonthEntry {
  /** `YYYY-MM`. */
  key: string;
  matches: number;
  wins: number;
  losses: number;
  /** Newest first. */
  sessions: SessionEntry[];
}

export interface ReportPeriods {
  /** When the data was last updated, already written for display ('02/10 à 10:53'). */
  freshness: string;
  firstDay: string;
  lastDay: string;
  /** Top ranked matches behind the references. */
  topMatches: number;
  /** Newest first. */
  patches: string[];
  /** Newest first. */
  months: MonthEntry[];
}
