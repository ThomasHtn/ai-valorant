import { Reference } from '@core/common/enums.model';
import { CellTone } from '@core/report/tone.model';
import { GameArt, StatCell, StatColumn, StatRow, StatTable } from '@core/report/stat-table.model';

/** Emitted when the analyst clicks a cell: the Rounds view lists the rounds behind it. */
export interface StatCellClick {
  table: StatTable;
  row: StatRow;
  column: StatColumn;
}

/** Column the rows are sorted by; `direction` -1 is descending. */
export interface StatSort {
  key: string;
  direction: 1 | -1;
}

/** How the table is read, from the view's `ViewState`. */
export interface StatDisplay {
  reference: Reference;
  colours: boolean;
  samples: boolean;
  referenceValues: boolean;
}

/** A cell ready to draw: no formatting or colouring left to do in the template. */
export interface CellView {
  key: string;
  column: StatColumn;
  cell: StatCell | undefined;
  text: string;
  tone: CellTone | null;
  /** Sample line under the value, when asked and meaningful. */
  sample: string | null;
  /** Reference value line under the value, when asked. */
  reference: string | null;
}

export interface RowView {
  row: StatRow;
  art: GameArt | null;
  cells: CellView[];
}

/** One line of the cell tip: who, the value, its sample, and whether it is the colour's reference. */
export interface TipLine {
  label: string;
  value: string;
  sample: string | null;
  isReference: boolean;
}
