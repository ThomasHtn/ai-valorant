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

/** Under this many seconds a time keeps one decimal ('1,3 s'); above it, whole seconds ('14 s'). */
const SECONDS_WITH_TENTHS = 10;

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
      // Short times (revenge delay, 1 to 3 s) need the tenth to tell players apart.
      return `${(Math.abs(value) < SECONDS_WITH_TENTHS ? ONE_DECIMAL : INTEGER).format(value)}${UNIT_SPACE}s`;
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

/** Gap between two values as written: '49 %' against '48 %' is 1 point, even from 0.4852 and 0.4811. */
export function displayedGap(value: number, reference: number, format: ValueFormat): number {
  return asShown(value, format) - asShown(reference, format);
}

function asShown(value: number, format: ValueFormat): number {
  const decimals =
    format === 'pct' || format === 'dec2'
      ? 2
      : format === 'dec1' || (format === 'sec' && Math.abs(value) < SECONDS_WITH_TENTHS)
        ? 1
        : 0;
  return Number(value.toFixed(decimals));
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
    const points = Math.round(size * 100);
    if (points === 0) {
      return `0${UNIT_SPACE}pt`;
    }
    return `${sign}${INTEGER.format(points)}${UNIT_SPACE}${points >= 2 ? 'pts' : 'pt'}`;
  }
  const text = formatValue(size, format);
  // A gap that rounds to zero ('0,0') gets no sign: '−0,0' would read as a loss.
  return /[1-9]/.test(text) ? `${sign}${text}` : text;
}
