import { CellTone } from '@core/report/tone.model';

/** A composition line: its agents, with those missing from the most played compo marked. */
export interface CompRow {
  key: string;
  rank: string;
  agents: { name: string; role: string; differs: boolean }[];
  share: number;
  shareText: string;
  rounds: string;
  roundsRate: number | null;
  matches: number;
  mine: boolean;
}

export interface RolePicks {
  role: string;
  label: string;
  agents: { name: string; share: number; shareText: string; squad: boolean }[];
}

export interface HabitRow {
  key: string;
  label: string;
  effect: string;
  top: string;
  squad: string;
  topShare: number | null;
  squadShare: number | null;
  tone: CellTone;
  cost: string;
  thin: boolean;
}

/** A share of the top ranked beside the squad's, with what was won there. */
export interface ShareRow {
  key: string;
  label: string;
  top: number | null;
  topText: string;
  squad: number | null;
  squadText: string;
  squadTone: CellTone;
  topWon: string;
  squadWon: string;
  squadWonTone: CellTone;
  squadCount: number;
}
