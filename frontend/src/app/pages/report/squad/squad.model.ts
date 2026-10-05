import { CellTone } from '@core/report/tone.model';
import { Gap, MapGap, SituationGroup } from '@core/report/squad.model';

/** One line of a gap board: a situation, a buy, a site. */
export interface GapRow {
  key: string;
  label: string;
  /** What is counted, under the label. */
  sub: string | null;
  /** Map whose thumbnail leads the line (sites). */
  map: string | null;
  /** Kind of situation, drawn as its icon. */
  group: SituationGroup | null;
  gap: Gap;
  /** Per-map gaps, for the boards that show the strip. */
  maps: MapGap[];
}

/** A gap as drawn: rate bar against the top ranked, volume and rounds. */
export interface GapCells {
  rate: number | null;
  rateText: string;
  top: number | null;
  tone: CellTone;
  volume: string;
  rounds: string;
  perMatch: string | null;
  thin: boolean;
}

export type VerdictKey = 'solid' | 'stabilize' | 'work' | 'test' | 'collecting';

export interface MapRow {
  map: string;
  matches: number;
  record: string;
  /** Matches won, 0 to 1. */
  winRate: number;
  winTone: CellTone;
  attack: GapCells;
  defense: GapCells;
  rounds: string;
  roundsTone: CellTone;
  verdict: VerdictKey;
  thin: boolean;
}
