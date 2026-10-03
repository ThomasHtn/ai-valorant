import { clock, freshness, longDay, monthTitle, roundLabel, shortDay } from './format.utils';
import { formatGap, formatValue } from './value-format.utils';

describe('format utils', () => {
  it('names a day in French without shifting it across timezones', () => {
    expect(shortDay('2026-10-01')).toBe('jeu. 1 oct.');
    expect(longDay('2026-09-30')).toBe('Mercredi 30 septembre');
    expect(monthTitle('2026-09')).toBe('Septembre 2026');
  });

  it('writes the data freshness from an ISO date-time', () => {
    expect(freshness('2026-10-02T10:53:33.026000+02:00')).toBe('02/10 à 10:53');
    expect(freshness('hier')).toBe('hier');
  });

  it('formats round times and rewatch labels', () => {
    expect(clock(83_400)).toBe('1:23');
    expect(roundLabel('2026-09-30', 'Split', 14)).toBe('30/09 Split R14');
  });
});

describe('value format utils', () => {
  it('writes each column format the French way, with a narrow no-break space', () => {
    expect(formatValue(0.4774, 'pct')).toBe('48 %');
    expect(formatValue(1.2567, 'dec2')).toBe('1,26');
    expect(formatValue(-2.66, 'dec1')).toBe('-2,7');
    expect(formatValue(14.2, 'sec')).toBe('14 s');
    expect(formatValue(16.4, 'm')).toBe('16 m');
    expect(formatValue(2300, 'cr')).toBe('2 300 crédits');
    expect(formatValue('12-15', 'text')).toBe('12-15');
    expect(formatValue(null, 'pct')).toBe('—');
  });

  it('writes signed gaps, in points for rates', () => {
    expect(formatGap(0.05, 'pct')).toBe('+5 pts');
    expect(formatGap(-0.12, 'dec2')).toBe('−0,12');
    expect(formatGap(0, 'int')).toBe('0');
    expect(formatGap(null, 'pct')).toBe('—');
  });

  it('writes a gap that rounds to zero without a sign, and one point in the singular', () => {
    expect(formatGap(-0.002, 'pct')).toBe('0\u202fpt');
    expect(formatGap(0.01, 'pct')).toBe('+1\u202fpt');
    expect(formatGap(-0.02, 'pct')).toBe('−2\u202fpts');
    expect(formatGap(-0.04, 'dec1')).toBe('0,0');
  });
});
