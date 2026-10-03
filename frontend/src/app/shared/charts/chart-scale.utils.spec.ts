import { describe, expect, it } from 'vitest';

import { linearScale, niceRange, niceStep, tickValues } from './chart-scale.utils';

describe('niceStep', () => {
  it('picks a round step splitting the span in about four', () => {
    expect(niceStep(1)).toBe(0.25);
    expect(niceStep(37)).toBe(10);
    expect(niceStep(0.08)).toBe(0.02);
  });

  it('falls back to 1 on an empty span', () => {
    expect(niceStep(0)).toBe(1);
  });
});

describe('niceRange', () => {
  it('snaps around the values with a margin', () => {
    expect(niceRange([0.42, 0.55], true)).toEqual({ min: 0.4, max: 0.55, step: 0.05 });
  });

  it('keeps rates within 0..1', () => {
    const range = niceRange([0.02, 0.98], true);
    expect(range.min).toBe(0);
    expect(range.max).toBe(1);
  });

  it('opens a band around a single value', () => {
    const range = niceRange([200], false);
    expect(range.min).toBeLessThan(200);
    expect(range.max).toBeGreaterThan(200);
  });
});

describe('tickValues', () => {
  it('lists every tick, the last one included despite float drift', () => {
    expect(tickValues({ min: 0.4, max: 0.6, step: 0.05 })).toEqual([0.4, 0.45, 0.5, 0.55, 0.6]);
  });
});

describe('linearScale', () => {
  it('maps the domain onto the range, inverted axes included', () => {
    const y = linearScale([0, 1], [300, 0]);
    expect(y(0)).toBe(300);
    expect(y(0.5)).toBe(150);
  });

  it('centres a flat domain', () => {
    expect(linearScale([2, 2], [0, 100])(2)).toBe(50);
  });
});
