import { describe, expect, it } from 'vitest';

import { fisherExact, halfPValue, normalTail, twoProportionPValue } from './proportion-test.utils';

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

  it("switches to Fisher's exact test under 5 expected successes, like the backend", () => {
    // 0 of 10 against 5 of 15: the z-test says 0.041, Fisher 0.061 (scipy).
    expect(twoProportionPValue(0, 10, 5 / 15, 15)).toBeCloseTo(0.0611, 3);
  });
});

describe('fisherExact', () => {
  it('matches scipy', () => {
    expect(fisherExact(1, 12, 8, 20)).toBeCloseTo(0.1032, 3);
    expect(fisherExact(3, 3, 0, 3)).toBeCloseTo(0.1, 6);
  });
});

describe('halfPValue', () => {
  it('is the exact binomial test against 50 %', () => {
    // scipy.stats.binomtest(305, 576).pvalue
    expect(halfPValue(305 / 576, 576)).toBeCloseTo(0.1691, 3);
    expect(halfPValue(0.5, 100)).toBe(1);
    expect(halfPValue(0, 10)).toBeCloseTo(0.001953, 5);
  });
});
