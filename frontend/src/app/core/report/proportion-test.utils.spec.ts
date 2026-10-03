import { describe, expect, it } from 'vitest';

import { normalTail, twoProportionPValue } from './proportion-test.utils';

describe('normalTail', () => {
  it('matches the normal table', () => {
    expect(normalTail(0)).toBeCloseTo(0.5, 6);
    expect(normalTail(1.96)).toBeCloseTo(0.025, 4);
  });
});

describe('twoProportionPValue', () => {
  it('is 1 without a sample or for equal rates', () => {
    expect(twoProportionPValue(0.5, 0, 0.4, 10)).toBe(1);
    expect(twoProportionPValue(null, 10, 0.4, 10)).toBe(1);
    expect(twoProportionPValue(0.5, 100, 0.5, 100)).toBeCloseTo(1, 6);
  });

  it('gives a small p-value for a large gap on large samples', () => {
    // 28 % of 2 101 against 34 % of 2 004.
    expect(twoProportionPValue(0.277, 2101, 0.34, 2004)).toBeLessThan(0.001);
  });

  it('keeps a small-sample gap above 0.05', () => {
    // 5 of 18 against 11 of 27.
    expect(twoProportionPValue(5 / 18, 18, 11 / 27, 27)).toBeGreaterThan(0.05);
  });
});
