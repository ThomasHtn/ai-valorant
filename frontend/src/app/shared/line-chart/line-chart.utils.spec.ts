import { describe, expect, it } from 'vitest';

import { LINE_CHART_BOX, POINT_INSET } from './line-chart.constants';
import { LinePoint } from './line-chart.model';
import { bandPolygons, buildLineChart, tickLabel } from './line-chart.utils';

const point = (value: number | null, sample = 100, highlighted = false): LinePoint => ({
  label: 'm',
  value,
  sample,
  highlighted,
});

describe('buildLineChart', () => {
  it('returns null when there is nothing to draw', () => {
    expect(buildLineChart([point(null)], 'pct', null, 'Top', [], 20)).toBeNull();
  });

  it('spans the plot from the first to the last point and skips gaps in the line', () => {
    const view = buildLineChart([point(0.4), point(null), point(0.5)], 'pct', null, 'Top', [], 20)!;
    expect(view.dots.map((d) => d.x)).toEqual([
      LINE_CHART_BOX.left + POINT_INSET,
      LINE_CHART_BOX.width - LINE_CHART_BOX.right - POINT_INSET,
    ]);
    expect(view.line.split(' ')).toHaveLength(2);
  });

  it('includes the reference in the value range and labels it', () => {
    const view = buildLineChart([point(0.4), point(0.45)], 'pct', 0.7, 'Top ranked', [], 20)!;
    expect(view.reference?.label).toBe('Top ranked 70\u202f%');
    const tickPositions = view.yTicks.map((t) => t.at);
    expect(view.reference!.y).toBeGreaterThanOrEqual(Math.min(...tickPositions));
  });

  it('greys points under the minimum sample and enlarges the period', () => {
    const view = buildLineChart([point(0.4, 12), point(0.5, 80, true)], 'pct', null, 'T', [], 20)!;
    expect(view.dots[0].small).toBe(true);
    expect(view.dots[1].highlighted).toBe(true);
    expect(view.dots[1].radius).toBeGreaterThan(view.dots[0].radius);
  });

  it('lets a point fade itself whatever its sample', () => {
    const view = buildLineChart(
      [
        { ...point(0.4, 500), faded: true },
        { ...point(0.5, 5), faded: false },
      ],
      'pct',
      null,
      'T',
      [],
      20,
    )!;
    expect(view.dots.map((d) => d.small)).toEqual([true, false]);
  });

  it('places a marker half-way before its point and drops one before the first', () => {
    const points = [point(1), point(2), point(3)];
    const view = buildLineChart(
      points,
      'dec2',
      null,
      'T',
      [
        { index: 0, label: '12.08' },
        { index: 2, label: '13.00' },
      ],
      0,
    )!;
    expect(view.markers).toHaveLength(1);
    expect(view.markers[0].x).toBeCloseTo((view.dots[1].x + view.dots[2].x) / 2);
  });
});

describe('bandPolygons', () => {
  const x = (i: number): number => i * 10;
  const y = (v: number): number => 100 - v * 100;
  const bounded = (value: number, low: number, high: number): LinePoint => ({
    ...point(value),
    low,
    high,
  });

  it('draws one polygon per run of bounded points, upper edge then lower edge back', () => {
    const points = [bounded(0.5, 0.25, 0.75), bounded(0.5, 0.375, 0.625), point(0.5)];
    expect(bandPolygons(points, x, y)).toEqual(['0,25 10,37.5 10,62.5 0,75']);
  });

  it('skips runs of a single point', () => {
    const points = [bounded(0.5, 0.25, 0.75), point(null), bounded(0.5, 0.25, 0.75)];
    expect(bandPolygons(points, x, y)).toEqual([]);
  });
});

describe('tickLabel', () => {
  it('writes rates as percentages and wide steps as whole numbers', () => {
    expect(tickLabel(0.45, 'pct', { min: 0, max: 1, step: 0.05 })).toBe('45\u202f%');
    expect(tickLabel(250, 'dec1', { min: 200, max: 300, step: 25 })).toBe('250');
    expect(tickLabel(0.9, 'dec2', { min: 0.8, max: 1.2, step: 0.1 })).toBe('0,90');
  });
});
