import { describe, expect, it } from 'vitest';

import { Trends } from '@core/report/trends.model';

import {
  availableGranularities,
  metricHelp,
  monthLabel,
  periodValue,
  sparkline,
  trendMarkers,
  valuePoint,
  trendPoints,
  trendReference,
} from './trend.utils';

const trends: Trends = {
  metrics: [
    {
      key: 'roundsWon',
      label: 'Rounds gagnés',
      format: 'pct',
      better: 1,
      help: 'roundsWon',
      top: null,
    },
    { key: 'retake', label: 'Retakes réussies', format: 'pct', better: 1, help: null, top: 0.26 },
  ],
  playerMetrics: [{ key: 'acs', label: 'ACS', format: 'dec1', better: 1, help: 'acs', top: 212 }],
  byMonth: [
    {
      key: '2026-08',
      matches: 2,
      wins: 1,
      values: { roundsWon: { v: 0.5, n: 40 } },
      inPeriod: false,
    },
    {
      key: '2026-09',
      matches: 27,
      wins: 12,
      values: { roundsWon: { v: 0.48, n: 576 } },
      inPeriod: true,
    },
  ],
  byPatch: [
    {
      key: '13.06',
      matches: 9,
      wins: 4,
      values: { roundsWon: { v: 0.47, n: 200 } },
      inPeriod: true,
    },
  ],
  players: [
    {
      name: 'Psilonnix',
      role: 'Duelist',
      top: { acs: 230 },
      byMonth: [{ key: '2026-09', values: { acs: { v: 281, n: 576 } }, inPeriod: true }],
    },
  ],
  series: [
    {
      index: 0,
      matchId: 'a',
      day: '2026-08-30',
      mapName: 'Split',
      patch: '13.05',
      won: true,
      roundsWon: 13,
      roundsLost: 7,
      acs: { Psilonnix: 250 },
      patchChange: false,
      inPeriod: false,
    },
    {
      index: 1,
      matchId: 'b',
      day: '2026-09-02',
      mapName: 'Lotus',
      patch: '13.06',
      won: false,
      roundsWon: 9,
      roundsLost: 13,
      acs: {},
      patchChange: true,
      inPeriod: true,
    },
  ],
  patchMarkers: [
    { index: 0, patch: '13.05', day: '2026-08-30' },
    { index: 1, patch: '13.06', day: '2026-09-02' },
  ],
};

describe('monthLabel', () => {
  it('abbreviates the month', () => {
    expect(monthLabel('2026-09')).toBe('sept. 2026');
  });
});

describe('availableGranularities', () => {
  it('offers patches to the squad and matches only for the per-match metric', () => {
    expect([...availableGranularities('team', 'roundsWon')]).toEqual(['month', 'patch', 'match']);
    expect([...availableGranularities('team', 'retake')]).toEqual(['month', 'patch']);
    expect([...availableGranularities('Psilonnix', 'acs')]).toEqual(['month', 'match']);
  });
});

describe('trendPoints', () => {
  it('reads months with their sample and the period highlighted', () => {
    const points = trendPoints(trends, 'team', 'roundsWon', 'month');
    expect(points.map((p) => p.value)).toEqual([0.5, 0.48]);
    expect(points[1]).toMatchObject({ label: 'sept. 2026', sample: 576, highlighted: true });
  });

  it('turns a match score into a rounds won share', () => {
    const points = trendPoints(trends, 'team', 'roundsWon', 'match');
    expect(points[0].value).toBeCloseTo(0.65);
    expect(points[0].detail).toBe('Split 13-7');
  });

  it('leaves a gap where a player did not play', () => {
    expect(trendPoints(trends, 'Psilonnix', 'acs', 'match').map((p) => p.value)).toEqual([
      250,
      null,
    ]);
  });
});

describe('valuePoint', () => {
  it('bands a rate and fades it when the interval is wide', () => {
    const small = valuePoint('oct.', { v: 0.64, n: 61 }, false, 'pct');
    const large = valuePoint('sept.', { v: 0.48, n: 576 }, true, 'pct');
    expect(small.faded).toBe(true);
    expect(large.faded).toBe(false);
    expect(large.low).toBeLessThan(0.48);
    expect(large.high).toBeGreaterThan(0.48);
  });

  it('fades an average on a small sample and draws no band', () => {
    const point = valuePoint('oct.', { v: 230, n: 40 }, false, 'dec1');
    expect(point.faded).toBe(true);
    expect(point.low).toBeUndefined();
  });

  it('never fades a match point', () => {
    expect(trendPoints(trends, 'team', 'roundsWon', 'match').every((p) => !p.faded)).toBe(true);
  });
});

describe('trendMarkers', () => {
  it('marks the month a patch arrived and skips the first patch', () => {
    expect(trendMarkers(trends, 'month')).toEqual([{ index: 1, label: '13.06' }]);
    expect(trendMarkers(trends, 'match')).toEqual([{ index: 1, label: '13.06' }]);
    expect(trendMarkers(trends, 'patch')).toEqual([]);
  });
});

describe('references and help', () => {
  it('uses the same-role top ranked value for a player and none for symmetric metrics', () => {
    expect(trendReference(trends, 'team', 'roundsWon')).toBeNull();
    expect(trendReference(trends, 'team', 'retake')).toBe(0.26);
    expect(trendReference(trends, 'Psilonnix', 'acs')).toBe(230);
  });

  it('fills a missing glossary key', () => {
    expect(metricHelp(trends.metrics[1])).toBe('spikeRetakeWon');
  });

  it('gives the latest month of the period', () => {
    expect(periodValue(trends, 'roundsWon')).toEqual({ month: '2026-09', value: 0.48 });
  });
});

describe('sparkline', () => {
  it('spreads the values over the full height and keeps the reference inside', () => {
    const view = sparkline(
      [
        { label: 'a', value: 0.4, sample: 100, highlighted: false },
        { label: 'b', value: 0.6, sample: 10, highlighted: true, faded: true },
      ],
      0.5,
    )!;
    expect(view.dots[0].y).toBeGreaterThan(view.dots[1].y);
    expect(view.referenceY).toBeCloseTo((view.dots[0].y + view.dots[1].y) / 2);
    expect(view.dots[1].small).toBe(true);
  });
});
