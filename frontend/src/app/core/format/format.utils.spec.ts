import {
  clock,
  decimal,
  longDay,
  percent,
  pointsChange,
  roundRef,
  shortDay,
  signedPoints,
  statValue,
} from './format.utils';

describe('format utils', () => {
  it('formats rates as rounded percentages, or a dash without tries', () => {
    expect(percent({ count: 21, total: 54, value: 21 / 54 })).toBe('39 %');
    expect(percent({ count: 0, total: 0, value: null })).toBe('-');
  });

  it('adds an explicit sign only when asked', () => {
    expect(decimal(1.234, 1, true)).toBe('+1.2');
    expect(decimal(-3.4, 1, true)).toBe('-3.4');
    expect(decimal(null)).toBe('-');
  });

  it('formats a statistic with its definition', () => {
    const rate = {
      key: 'kast',
      label: 'KAST',
      kind: 'rate',
      higherIsBetter: true,
      decimals: 0,
      signed: false,
      definition: '',
    } as const;
    const impact = { ...rate, key: 'impact', kind: 'mean', decimals: 1, signed: true } as const;
    expect(statValue(rate, 0.714)).toBe('71 %');
    expect(statValue(impact, 3.42)).toBe('+3.4');
  });

  it('computes the change in points between two rates', () => {
    const now = { count: 48, total: 100, value: 0.48 };
    expect(pointsChange(now, { count: 50, total: 100, value: 0.5 })).toBe(-2);
    expect(pointsChange(now, null)).toBeNull();
    expect(signedPoints(-2)).toBe('-2 pts');
    expect(signedPoints(0)).toBe('=');
  });

  it('formats round times and rewatch references', () => {
    expect(clock(83_400)).toBe('1:23');
    expect(
      roundRef({
        matchId: 'm',
        startedAt: '2026-09-30T21:00:00+02:00',
        mapName: 'Split',
        roundNumber: 14,
      }),
    ).toBe('30/09 Split R14');
  });

  it('names a day in French without shifting it across timezones', () => {
    expect(shortDay('2026-10-01')).toBe('jeu. 1 oct.');
    expect(longDay('2026-09-30')).toBe('Mercredi 30 septembre');
  });
});
