import { Reference } from '@core/common/enums.model';

import { StatCell, StatColumn } from './stat-table.model';
import { MEAN_AVERAGE_BAND, RATE_AVERAGE_BAND } from './tone.constants';
import { CellTone } from './tone.model';

/**
 * Reference a column is coloured against: none for counts, the squad's history when the column forces
 * it (symmetric stats such as rounds won), otherwise the analyst's choice.
 */
export function columnReference(column: StatColumn, chosen: Reference): Reference | null {
  if (column.ref === 'none') {
    return null;
  }
  return column.ref === 'hist' ? 'hist' : chosen;
}

/** Reference of one cell: a symmetric cell forces the history in any coloured column. */
export function cellReference(
  cell: StatCell,
  column: StatColumn,
  chosen: Reference,
): Reference | null {
  const reference = columnReference(column, chosen);
  return reference && cell.ref === 'hist' ? 'hist' : reference;
}

/** Value of a cell for one reference cohort, and its sample. */
export function referenceValue(
  cell: StatCell,
  reference: Reference,
): { value: StatCell['v'] | undefined; sample: number | null | undefined } {
  switch (reference) {
    case 'top':
      return { value: cell.top, sample: cell.topN };
    case 'opp':
      return { value: cell.opp, sample: cell.oppN };
    case 'hist':
      return { value: cell.hist, sample: cell.histN };
  }
}

/**
 * Colour of a cell against the chosen reference, as the mockup validated it:
 * grey when the squad or the reference is under the column's minimum sample; for rates (0..1) orange within 3 points of the reference,
 * for means orange within 5 % of it; green when better in the column's direction, red when worse.
 * Text cells, neutral columns and cells without reference stay uncoloured (null).
 */
export function cellTone(
  cell: StatCell | undefined,
  column: StatColumn,
  chosen: Reference,
): CellTone | null {
  if (!cell || typeof cell.v !== 'number' || column.better === 0) {
    return null;
  }
  const reference = cellReference(cell, column, chosen);
  if (!reference) {
    return null;
  }
  if (column.min && isBelow(cell.n, column.min)) {
    return 'small';
  }
  const { value, sample } = referenceValue(cell, reference);
  if (typeof value !== 'number') {
    return null;
  }
  // A reference on a few rounds judges nothing either.
  if (column.min && isBelow(sample, column.min)) {
    return 'small';
  }
  const isRate = column.format === 'pct';
  const absolute = isRate || typeof column.band === 'number' || value === 0;
  const raw = absolute ? cell.v - value : (cell.v - value) / Math.abs(value);
  const gap = raw * column.better;
  const band = isRate ? RATE_AVERAGE_BAND : (column.band ?? MEAN_AVERAGE_BAND);
  if (Math.abs(gap) < band) {
    return 'avg';
  }
  return gap > 0 ? 'good' : 'bad';
}

function isBelow(sample: number | null | undefined, min: number): boolean {
  return sample !== null && sample !== undefined && sample < min;
}
