import { CellValue } from '@core/report/stat-table.model';
import { ValueFormat } from '@core/format/value-format.model';

/** Teams and periods side by side, or one player against another. */
export type CompareMode = 'team' | 'players';

/** Who a team selection reads in each cell: the squad in the period, its history, its opponents, top ranked. */
export type CompareCohort = 'squad' | 'hist' | 'opp' | 'top';

/** One side of a comparison line: the value and the sample behind it. */
export interface CompareValue {
  value: CellValue;
  sample: number | null;
}

/** Gap A - B: its text, whether it can come from chance (`ns`) or which way it goes. */
export interface CompareGap {
  text: string;
  tone: 'ns' | 'good' | 'bad';
  /** Sentence of the gap's tip. */
  tip: string;
}

/** One metric of one row compared between A and B. */
export interface CompareLine {
  key: string;
  /** Row of the table ('Split', 'Psilonnix'); empty in player mode. */
  rowLabel: string;
  rowSub: string | null;
  columnLabel: string;
  help: string | null;
  format: ValueFormat;
  a: CompareValue;
  b: CompareValue;
  gap: CompareGap;
}

/** Lines of one table of the domain. */
export interface CompareGroup {
  id: string;
  title: string;
  lines: CompareLine[];
}

/** An option of a selection box. */
export interface CompareOption {
  value: string;
  label: string;
}
