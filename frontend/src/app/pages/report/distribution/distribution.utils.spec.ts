import { describe, expect, it } from 'vitest';

import { Distribution, Histogram } from '@core/report/distributions.model';

import { distributionSeries, medianGap, readingSentence } from './distribution.utils';

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

describe('readingSentence', () => {
  const series = (squad: number | null, top: number | null, who = "L'escouade") => ({
    squad: histogram(squad),
    top: histogram(top),
    who,
    topLabel: 'Top ranked',
  });

  it('says what the gap means in game terms, with its sign', () => {
    expect(readingSentence('firstKillTime', series(12, 10), 's')).toBe(
      "L'escouade prend le premier contact 2\u202fs plus tard que le top ranked.",
    );
    expect(readingSentence('firstKillTime', series(8, 10), 's')).toBe(
      "L'escouade prend le premier contact 2\u202fs plus tôt que le top ranked.",
    );
  });

  it('names a player against his role', () => {
    expect(readingSentence('acsPerMatch', series(110, 190, 'DuffManBzH'), 'ACS')).toBe(
      "L'ACS médian de DuffManBzH est 80\u202fACS sous celui du top ranked du même rôle.",
    );
  });

  it('handles an equal median and a missing one', () => {
    expect(readingSentence('plantTime', series(30.2, 30), 's')).toBe(
      "L'escouade plante au même moment que le top ranked.",
    );
    expect(readingSentence('plantTime', series(null, 30), 's')).toBeNull();
    expect(readingSentence('unknown', series(1, 2), 's')).toBeNull();
  });
});
