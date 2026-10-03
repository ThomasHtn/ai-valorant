import { describe, expect, it } from 'vitest';

import { Histogram, HistogramBin } from '@core/report/distributions.model';

import { HISTOGRAM_BOX } from './histogram.constants';
import { buildHistogram, labelEvery, shareAxis, withUnit } from './histogram.utils';

const bins: HistogramBin[] = [
  { start: 0, end: 5, label: '0-5 s' },
  { start: 5, end: 10, label: '5-10 s' },
  { start: 10, end: null, label: '10+ s' },
];
const histogram = (shares: number[], median: number | null): Histogram => ({
  counts: shares.map((s) => s * 100),
  shares,
  n: 100,
  median,
});

describe('shareAxis', () => {
  it('uses 5-point steps under 30 % and 10-point steps above', () => {
    expect(shareAxis(0.22)).toEqual({ max: 0.25, step: 0.05 });
    expect(shareAxis(0.42)).toEqual({ max: 0.5, step: 0.1 });
  });
});

describe('labelEvery', () => {
  it('thins the labels of crowded axes', () => {
    expect(labelEvery(11)).toBe(1);
    expect(labelEvery(19)).toBe(2);
    expect(labelEvery(29)).toBe(3);
  });
});

describe('buildHistogram', () => {
  const view = buildHistogram({
    bins,
    binSize: 5,
    unit: 's',
    squad: histogram([0.2, 0.5, 0.3], 7.5),
    top: histogram([0.4, 0.4, 0.2], 6),
    squadName: 'escouade',
  })!;

  it('draws one bar per bin, taller for a larger share', () => {
    expect(view.bars).toHaveLength(3);
    expect(view.bars[1].height).toBeGreaterThan(view.bars[0].height);
    expect(view.bars[0].topPath).toMatch(/^M/);
  });

  it('labels the open last bin with a plus', () => {
    expect(view.xLabels.at(-1)?.label).toBe('10+');
  });

  it('places the medians on the value axis, the open bin counting one bin wide', () => {
    const plot = HISTOGRAM_BOX.width - HISTOGRAM_BOX.left - HISTOGRAM_BOX.right;
    expect(view.medians[0].x).toBeCloseTo(HISTOGRAM_BOX.left + plot * (7.5 / 15));
    expect(view.medians[0].label).toBe(`Médiane escouade ${withUnit(7.5, 's')}`);
  });

  it('moves the second median label down when both are close', () => {
    expect(view.medians[1].shift).toBeGreaterThan(0);
  });
});
