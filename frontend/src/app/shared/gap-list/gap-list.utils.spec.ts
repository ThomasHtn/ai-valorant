import { Rate } from '@core/common/common.model';

import { GapLine } from './gap-list.model';
import { gapLabel, gapRows } from './gap-list.utils';

function rate(count: number, total: number): Rate {
  return { count, total, value: total ? count / total : null };
}

function line(label: string, squad: Rate, reference: Rate | null = rate(25, 100)): GapLine {
  return { label, squad, reference };
}

describe('gapRows', () => {
  it('puts the costliest line first and small or unreferenced samples last', () => {
    const rows = gapRows([
      line('Split A', rate(3, 19)),
      line('Sunset B', rate(0, 16)),
      line('Haven B', rate(0, 3)),
      line('Lotus C', rate(9, 18), null),
      line('Never played', rate(0, 0)),
    ]);
    expect(rows.map((r) => r.label)).toEqual(['Sunset B', 'Split A', 'Haven B', 'Lotus C']);
    expect(rows.map((r) => r.rating)).toEqual(['bad', 'bad', 'unknown', 'unknown']);
  });

  it('reads a gap under one whole round as even', () => {
    const [row] = gapRows([line('Sunset B', rate(8, 11), rate(75, 100))]);
    expect(row.rating).toBe('average');
  });
});

describe('gapLabel', () => {
  it('writes a gap the way a player says it', () => {
    expect(gapLabel(0.4)).toBe('=');
    expect(gapLabel(1.2)).toBe('+1 round');
    expect(gapLabel(-4.7)).toBe('-5 rounds');
    expect(gapLabel(-2, { one: 'first blood', many: 'first bloods' })).toBe('-2 first bloods');
  });
});
