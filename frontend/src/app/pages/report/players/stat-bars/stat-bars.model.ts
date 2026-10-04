import { CellTone } from '@core/report/tone.model';

/** One figure as a game attribute bar: value, where it sits on its scale, its reference. */
export interface StatBarRow {
  key: string;
  label: string;
  help: string | null;
  /** 1 higher is better, -1 lower is better, 0 neutral. */
  better: number;
  value: string;
  tone: CellTone | null;
  /** Fill of the bar, 0..1; null draws no bar. */
  reach: number | null;
  /** Reference tick on the bar, 0..1; null without one. */
  referenceReach: number | null;
  /** 'Initiateurs adverses 164', or null without a reference value. */
  reference: string | null;
  /** 'sur 445 rounds', '2 sur 5 clutchs'. */
  sample: string | null;
}
