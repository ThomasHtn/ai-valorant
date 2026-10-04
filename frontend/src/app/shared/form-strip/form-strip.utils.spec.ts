import { describe, expect, it } from 'vitest';

import { formBars } from './form-strip.utils';

describe('formBars', () => {
  it('draws wins up, losses down, bigger margins taller', () => {
    const bars = formBars([
      { day: '2026-10-01', map: 'Split', patch: '13.06', score: '13-11', margin: 2 },
      { day: '2026-10-01', map: 'Ascent', patch: '13.06', score: '3-13', margin: -10 },
    ]);
    expect(bars.map((b) => b.result)).toEqual(['win', 'loss']);
    expect(bars[1].height).toBeGreaterThan(bars[0].height);
    expect(bars[0].tip.title).toBe('Split');
  });

  it('keeps only the latest matches', () => {
    const many = Array.from({ length: 50 }, (_, i) => ({
      day: '2026-10-01',
      map: `M${i}`,
      patch: '13.06',
      score: '13-5',
      margin: 8,
    }));
    const bars = formBars(many);
    expect(bars).toHaveLength(40);
    expect(bars[39].tip.title).toBe('M49');
  });
});
