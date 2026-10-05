import { CellTone } from '@core/report/tone.model';

/** One headline figure of a band: its ring (optional), value and the line saying what it rests on. */
export interface KpiItem {
  key: string;
  label: string;
  /** Explanation key of the "i" tip. */
  help?: string;
  /** Value as written: '44', with its unit apart ('%'). */
  value: string;
  unit?: string;
  tone: CellTone | null;
  /** Ring fill and reference tick, 0 to 1; no ring when null. */
  fraction?: number | null;
  mark?: number | null;
  /** '12 V, 15 D sur 27 matchs'. */
  sub: string;
}
