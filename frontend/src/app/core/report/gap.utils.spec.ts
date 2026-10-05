import { describe, expect, it } from 'vitest';

import { byCost, gapTone, mapVerdict, signedRounds } from './gap.utils';
import { Gap } from './squad.model';

const gap = (k: number, n: number, top: number | null): Gap => ({
  k,
  n,
  top,
  topN: 1000,
  rounds: top === null ? null : Math.round((k - n * top) * 10) / 10,
});

describe('gapTone', () => {
  it('is grey on a thin sample', () => {
    expect(gapTone(gap(1, 4, 0.5))).toBe('small');
  });

  it('stays orange within 3 points of the top ranked', () => {
    expect(gapTone(gap(51, 100, 0.5))).toBe('avg');
  });

  it('turns red or green beyond, by its sign', () => {
    expect(gapTone(gap(10, 25, 0.5))).toBe('bad');
    expect(gapTone(gap(140, 200, 0.5))).toBe('good');
  });
});

describe('signedRounds', () => {
  it('writes a true minus and one decimal at most', () => {
    expect(signedRounds(-4.44)).toBe('−4,4');
    expect(signedRounds(3)).toBe('+3');
    expect(signedRounds(0.04)).toBe('0');
    expect(signedRounds(null)).toBe('–');
  });
});

describe('byCost', () => {
  it('puts the costliest first and thin samples last', () => {
    const items = [gap(2, 3, 0.9), gap(40, 100, 0.5), gap(45, 100, 0.5)];
    expect(byCost(items, (g) => g).map((g) => g.k)).toEqual([40, 45, 2]);
  });
});

describe('mapVerdict', () => {
  it('waits for three matches, then judges the rounds', () => {
    expect(mapVerdict(4, 2)).toBe('test');
    expect(mapVerdict(2, 3)).toBe('solid');
    expect(mapVerdict(-5, 4)).toBe('work');
    expect(mapVerdict(-1, 4)).toBe('stabilize');
  });
});
