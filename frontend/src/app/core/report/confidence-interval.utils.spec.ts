import { describe, expect, it } from 'vitest';

import { wilsonInterval } from './confidence-interval.utils';

describe('wilsonInterval', () => {
  it('is null without a sample', () => {
    expect(wilsonInterval(0.5, 0)).toBeNull();
    expect(wilsonInterval(null, 40)).toBeNull();
  });

  it('matches the textbook value for 50 % on 100 tries', () => {
    const interval = wilsonInterval(0.5, 100);
    expect(interval?.low).toBeCloseTo(0.404, 3);
    expect(interval?.high).toBeCloseTo(0.596, 3);
  });

  it('stays inside 0..1 for extreme rates', () => {
    const interval = wilsonInterval(0, 5);
    expect(interval?.low).toBe(0);
    expect(interval?.high).toBeGreaterThan(0);
    expect(interval?.high).toBeLessThan(1);
  });

  it('narrows as the sample grows', () => {
    const small = wilsonInterval(0.6, 50)!;
    const large = wilsonInterval(0.6, 600)!;
    expect(large.high - large.low).toBeLessThan(small.high - small.low);
  });
});
