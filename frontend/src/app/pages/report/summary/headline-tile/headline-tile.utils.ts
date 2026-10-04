import { Reference } from '@core/common/enums.model';
import { formatGap, formatValue, integer } from '@core/format/value-format.utils';
import { StatCell, StatColumn } from '@core/report/stat-table.model';
import { cellTone, columnReference, referenceValue } from '@core/report/tone.utils';

import { HeadlineTile } from './headline-tile.model';

/** How a reference reads after a figure ('au top ranked'); the history uses the period's name. */
function referencePhrase(reference: Reference, historyName: string): string {
  if (reference === 'hist') {
    return historyName.toLowerCase();
  }
  return reference === 'top' ? 'au top ranked' : 'chez les adversaires';
}

/** Short name of a reference after 'vs' ('top ranked', 'avant septembre'). */
function referenceName(reference: Reference, historyName: string): string {
  if (reference === 'hist') {
    return historyName.toLowerCase();
  }
  return reference === 'top' ? 'top ranked' : 'adversaires';
}

/** 'c'est mieux' or why it is not judged, from the tone of the figure. */
function verdictWords(tone: HeadlineTile['tone']): string {
  switch (tone) {
    case 'good':
      return "c'est mieux.";
    case 'bad':
      return "c'est moins bien.";
    case 'avg':
      return "c'est proche.";
    case 'small':
      return 'trop peu de données pour juger.';
    default:
      return 'pas de jugement.';
  }
}

/** '2 points de moins', '1,0 de plus': the gap in words. */
function gapWords(gap: number, column: StatColumn): string {
  const way = gap < 0 ? 'de moins' : 'de plus';
  if (column.format === 'pct') {
    const points = Math.round(Math.abs(gap) * 100);
    return `${integer(points)} point${points > 1 ? 's' : ''} ${way}`;
  }
  return `${formatValue(Math.abs(gap), column.format)} ${way}`;
}

/**
 * A headline figure against the reference its column is compared with: the ring of a rate, the gap
 * as a coloured arrow, and a hover sentence that says what the arrow means.
 */
export function headlineTile(
  key: string,
  label: string,
  help: string | null,
  cell: StatCell,
  column: StatColumn,
  chosen: Reference,
  historyName: string,
  sampleUnit: string | null,
  valueUnit: string | null,
): HeadlineTile {
  const value = typeof cell.v === 'number' ? cell.v : null;
  const reference = columnReference(column, chosen);
  const raw = reference ? referenceValue(cell, reference).value : null;
  const refValue = typeof raw === 'number' ? raw : null;
  const tone = cellTone(cell, column, chosen);
  const text = formatValue(cell.v, column.format);
  const better =
    column.better > 0 ? 'Plus haut = mieux' : column.better < 0 ? 'Plus bas = mieux' : null;

  let delta: HeadlineTile['delta'] = null;
  let sentence = text;
  if (value !== null && refValue !== null && reference) {
    const gap = value - refValue;
    const gapText = formatGap(gap, column.format);
    const flat = !/[1-9]/.test(gapText);
    delta = { direction: flat ? 'flat' : gap > 0 ? 'up' : 'down', text: flat ? 'égal' : gapText };
    const where = referencePhrase(reference, historyName);
    sentence = flat
      ? `${text}, autant que ${formatValue(refValue, column.format)} ${where}.`
      : `${text} contre ${formatValue(refValue, column.format)} ${where} : ${gapWords(gap, column)}.`;
  }

  return {
    key,
    label,
    help,
    value: text,
    unit: valueUnit,
    tone,
    ring: column.format === 'pct' && value !== null ? { value, reference: refValue } : null,
    delta,
    referenceLine:
      reference && refValue !== null
        ? `vs ${referenceName(reference, historyName)} (${formatValue(refValue, column.format)})`
        : null,
    sample: cell.n ? `Sur ${integer(cell.n)}${sampleUnit ? ` ${sampleUnit}` : ''}` : null,
    tip: {
      title: label,
      text: sentence,
      note: better ? `${better}, donc ${verdictWords(tone)}` : undefined,
    },
  };
}
