import { BuyType, Side } from '@core/common/enums.model';

/** One cell of the buy matrix: rounds won out of rounds played, and how it reads. */
export interface MatrixCell {
  buy: BuyType;
  won: number;
  played: number;
  /** Against the same cell over every map; 'small' under the minimum sample. */
  tone: 'good' | 'bad' | 'neutral' | 'small';
}

/** One row of the matrix: a map (or every map) on one side. */
export interface MatrixRow {
  /** Empty for the row over every map. */
  map: string;
  side: Side;
  cells: MatrixCell[];
  total: MatrixCell;
}

/** Moments of a match that cost rounds, each one a filter of the round list. */
export type MomentKind = 'streak' | 'after_pistol_loss' | 'bonus';

/** One line of the "moments qui coûtent" block. */
export interface CostlyMoment {
  key: 'throws' | 'pistols' | MomentKind;
  label: string;
  /** Main figure ('12', '21 sur 54'). */
  figure: string;
  /** What the figure counts, written right after it ('séries', 'gagnés'). */
  unit: string;
  /** What the line covers, under its label. */
  detail: string;
  /** Bad when it marks rounds thrown away, null when the figure only counts. */
  bad: boolean;
}
