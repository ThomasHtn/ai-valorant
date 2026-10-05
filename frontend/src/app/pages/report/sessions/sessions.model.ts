import { CellTone } from '@core/report/tone.model';

/** A map played in a session, as a thumbnail underlined by its result. */
export interface SessionMap {
  key: string;
  map: string;
  won: boolean;
  score: string;
  offPool: boolean;
}

/** One line of the session list. */
export interface SessionRow {
  day: string;
  label: string;
  span: string;
  maps: SessionMap[];
  record: string;
  winning: boolean;
  rounds: { rate: number | null; text: string; tone: CellTone };
  firstDuels: { text: string; tone: CellTone };
  turning: number;
  best: { name: string; agent: string; acs: number } | null;
  /** Rounds won over (+) or under (-) the month's rate on the session's rounds. */
  gap: string;
  gapTone: CellTone;
}

/** One match of a session page. */
export interface SessionMatchRow {
  matchId: string;
  map: string;
  score: string;
  won: boolean;
  rate: number;
  rateText: string;
  when: string;
  best: { name: string; agent: string; acs: number } | null;
  turning: number;
  offPool: boolean;
}
