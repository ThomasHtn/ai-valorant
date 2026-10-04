import { CellTone } from '@core/report/tone.model';

/** A headline figure of the session beside the month's. */
export interface DebriefTile {
  key: string;
  label: string;
  value: string;
  tone: CellTone | null;
  lines: string[];
}

/** A player of the session against his own month. */
export interface PlayerForm {
  name: string;
  /** Agent he played most in the session. */
  agent: string;
  matches: number;
  acs: number;
  /** Session ACS minus month ACS, null without month matches. */
  acsGap: number | null;
  kd: number;
  kdGap: number | null;
}

/** A lost round the squad had in hand, linked to its page. */
export interface TurningRound {
  key: string;
  matchId: string;
  roundNumber: number;
  mapName: string;
  cause: string;
  /** 'Throw à 78 %', 'Avait 62 % de chances'. */
  chance: string;
}
