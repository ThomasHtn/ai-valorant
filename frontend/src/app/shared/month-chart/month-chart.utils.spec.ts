import { buildMonthChart, monthRange, monthTipLines, smoothPath } from './month-chart.utils';

const tick = (label: string, faded = false) => ({ key: label, label, sample: '10 matchs', faded });

describe('monthRange', () => {
  it('snaps the values and the reference to the 10 point grid', () => {
    const series = [{ key: 'a', label: 'A', color: 'red', values: [0.36, 0.53], total: '' }];
    expect(monthRange(series, 0.5)).toEqual([0.3, 0.6]);
  });
});

describe('smoothPath', () => {
  it('starts on the first point and ends on the last', () => {
    const d = smoothPath([
      [0, 50],
      [500, 0],
      [1000, 50],
    ]);
    expect(d.startsWith('M0 50')).toBe(true);
    expect(d.endsWith('1000 50')).toBe(true);
  });
});

describe('buildMonthChart', () => {
  it('breaks the line where a month has no value and fades thin months', () => {
    const view = buildMonthChart(
      [{ key: 'a', label: 'A', color: 'red', values: [0.4, 0.5, null, 0.45, 0.5], total: '' }],
      [tick('Mai'), tick('Juin'), tick('Juillet'), tick('Août', true), tick('Septembre')],
      0.5,
    );
    expect(view.paths.length).toBe(2);
    expect(view.dots.length).toBe(4);
    expect(view.dots.find((d) => d.key === 'a-3')?.faded).toBe(true);
    expect(view.ticks[0].x).toBe(4);
    expect(view.ticks[4].x).toBe(96);
  });
});

describe('monthTipLines', () => {
  it('lists each series with its detail, skipping months without a value', () => {
    const series = [
      {
        key: 'a',
        label: 'A',
        color: 'red',
        values: [0.5, null],
        total: '',
        details: ['50 % (5 sur 10)', null],
      },
      { key: 'b', label: 'B', color: 'blue', values: [0.4, 0.3], total: '' },
    ];
    expect(monthTipLines(series, 0).map((l) => l.value.replace(/\s/g, ' '))).toEqual([
      '50 % (5 sur 10)',
      '40 %',
    ]);
    expect(monthTipLines(series, 1).map((l) => l.key)).toEqual(['b']);
  });

  it('gives each month a hover zone covering the whole plot', () => {
    const view = buildMonthChart(
      [{ key: 'a', label: 'A', color: 'red', values: [0.4, 0.5, 0.45], total: '' }],
      [tick('Mai'), tick('Juin'), tick('Juillet')],
      null,
    );
    const zones = view.ticks.map((t) => [t.from, t.width]);
    expect(zones[0][0]).toBe(0);
    expect(zones.reduce((sum, [, w]) => sum + w, 0)).toBeCloseTo(100, 0);
  });
});
