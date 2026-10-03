import { describe, expect, it } from 'vitest';

import { Distribution, Histogram } from '@core/report/distributions.model';

import { distributionSeries, medianGap } from './distribution.utils';

const histogram = (median: number | null): Histogram => ({
  counts: [1],
  shares: [1],
  n: 1,
  median,
});

const distribution: Distribution = {
  key: 'acsPerMatch',
  label: 'ACS par match',
  unit: 'ACS',
  binSize: 25,
  bins: [{ start: 0, end: null, label: '0+ ACS' }],
  squad: histogram(210),
  top: histogram(206),
  players: [{ name: 'DuffManBzH', role: 'Initiator', squad: histogram(110), top: histogram(190) }],
};

describe('distributionSeries', () => {
  it('shows the squad by default', () => {
    const series = distributionSeries(distribution, 'squad');
    expect(series.who).toBe("L'escouade");
    expect(series.squad.median).toBe(210);
  });

  it('compares a player with top ranked players of his role', () => {
    const series = distributionSeries(distribution, 'DuffManBzH');
    expect(series.squad.median).toBe(110);
    expect(series.topLabel).toBe('Top ranked, initiateur');
  });

  it('falls back to the squad for an unknown player', () => {
    expect(distributionSeries(distribution, 'nobody').who).toBe("L'escouade");
  });
});

describe('medianGap', () => {
  it('writes a signed gap with its unit', () => {
    expect(medianGap(histogram(12), histogram(10), 's')).toBe('+2 s');
    expect(medianGap(histogram(10), histogram(19), 's')).toBe('−9 s');
  });

  it('is null without a median', () => {
    expect(medianGap(histogram(null), histogram(10), 's')).toBeNull();
  });
});
