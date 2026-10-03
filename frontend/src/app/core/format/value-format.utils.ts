import { EMPTY } from './format.utils';
import { ValueFormat } from './value-format.model';

/** Narrow no-break space, the French separator before a unit ('48 %', '14 s'). */
export const UNIT_SPACE = ' ';

const INTEGER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const ONE_DECIMAL = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const TWO_DECIMALS = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats a whole number the French way ('1 741'). */
export function integer(value: number): string {
  return INTEGER.format(value);
}

/**
 * Writes a value in its column's format: '48 %', '1,26', '14 s', '16 m', '2 300 crédits'.
 * Text passes through; a missing value is a dash.
 */
export function formatValue(
  value: number | string | null | undefined,
  format: ValueFormat,
): string {
  if (value === null || value === undefined || value === '') {
    return EMPTY;
  }
  if (typeof value === 'string') {
    return value;
  }
  switch (format) {
    case 'pct':
      return `${INTEGER.format(value * 100)}${UNIT_SPACE}%`;
    case 'dec1':
      return ONE_DECIMAL.format(value);
    case 'dec2':
      return TWO_DECIMALS.format(value);
    case 'sec':
      return `${INTEGER.format(value)}${UNIT_SPACE}s`;
    case 'm':
      return `${INTEGER.format(value)}${UNIT_SPACE}m`;
    case 'cr':
      return `${INTEGER.format(value)}${UNIT_SPACE}crédits`;
    case 'int':
      return INTEGER.format(value);
    default:
      return Number.isInteger(value) ? INTEGER.format(value) : TWO_DECIMALS.format(value);
  }
}

/**
 * Signed difference between two values in the same format: '+5 pts' for rates, '−0,12' otherwise.
 * Uses the minus sign, not a hyphen, so negative gaps line up with positive ones.
 */
export function formatGap(gap: number | null | undefined, format: ValueFormat): string {
  if (gap === null || gap === undefined) {
    return EMPTY;
  }
  const sign = gap > 0 ? '+' : gap < 0 ? '−' : '';
  const size = Math.abs(gap);
  if (format === 'pct') {
    return `${sign}${INTEGER.format(size * 100)}${UNIT_SPACE}pts`;
  }
  return `${sign}${formatValue(size, format)}`;
}
