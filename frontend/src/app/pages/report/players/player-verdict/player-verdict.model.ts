import { CellTone } from '@core/report/tone.model';

/** A strength or a weakness of the player, as a figure and a sentence. */
export interface VerdictItem {
  key: string;
  label: string;
  /** '58 %'. */
  value: string;
  tone: CellTone;
  /** '10 points de moins que les initiateurs des équipes affrontées (68 %), sur 445 rounds.' */
  sentence: string;
}

export interface PlayerVerdict {
  strengths: VerdictItem[];
  weaknesses: VerdictItem[];
  /** Figures better, close to and worse than the reference. */
  counts: { good: number; avg: number; bad: number };
}
