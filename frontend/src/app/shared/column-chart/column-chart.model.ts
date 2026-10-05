import { CellTone } from '@core/report/tone.model';

/** One column: a share from 0 to 1 with its label under it. */
export interface ChartColumn {
  key: string;
  label: string;
  value: number | null;
  /** Value as written over the column: '62 %'. */
  text: string;
  tone: CellTone;
  /** Hover text. */
  title: string;
}
