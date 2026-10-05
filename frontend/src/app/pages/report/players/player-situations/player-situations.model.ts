import { CellTone } from '@core/report/tone.model';

/** A player situation ready to draw. */
export interface SituationLine {
  key: string;
  label: string;
  detail: string;
  volume: string;
  rate: number | null;
  rateText: string;
  top: number | null;
  tone: CellTone;
  /** '−14,5 morts'. */
  gap: string;
  cost: string;
  thin: boolean;
}
