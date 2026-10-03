import { ValueFormat } from '@core/format/value-format.model';
import { formatValue, integer } from '@core/format/value-format.utils';
import { AxisRange, linearScale, niceRange, tickValues } from '@shared/charts/chart-scale.utils';

import {
  DENSE_LABELS,
  DENSE_POINTS,
  DOT_RADIUS,
  LINE_CHART_BOX,
  POINT_INSET,
} from './line-chart.constants';
import { ChartMarker, LineChartView, LinePoint } from './line-chart.model';

/** Writes a tick: percentages for rates, whole numbers for wide steps, two decimals otherwise. */
export function tickLabel(value: number, format: ValueFormat, range: AxisRange): string {
  if (format === 'pct') {
    return formatValue(value, 'pct');
  }
  return formatValue(value, range.step >= 1 ? 'int' : 'dec2');
}

/**
 * Geometry of a line chart: value axis snapped to round ticks (the reference line included in its
 * range), one x slot per point, gaps for missing values, markers half-way before their point.
 */
export function buildLineChart(
  points: readonly LinePoint[],
  format: ValueFormat,
  reference: number | null,
  referenceLabel: string,
  markers: readonly ChartMarker[],
  minSample: number,
  boxWidth: number = LINE_CHART_BOX.width,
): LineChartView | null {
  const values = points.flatMap((p) => (p.value === null ? [] : [p.value]));
  if (reference !== null) {
    values.push(reference);
  }
  if (!values.length) {
    return null;
  }
  const { height, left, right, top, bottom } = LINE_CHART_BOX;
  const width = boxWidth;
  const range = niceRange(values, format === 'pct');
  const y = linearScale([range.min, range.max], [height - bottom, top]);
  const count = points.length;
  const x =
    count === 1
      ? () => (left + width - right) / 2
      : linearScale([0, count - 1], [left + POINT_INSET, width - right - POINT_INSET]);
  const dense = count > DENSE_POINTS;
  const labelEvery = dense ? Math.ceil(count / DENSE_LABELS) : 1;
  const slot = count > 1 ? x(1) - x(0) : 0;

  return {
    width,
    height,
    left,
    right,
    top,
    bottom,
    dense,
    yTicks: tickValues(range).map((v) => ({ at: y(v), label: tickLabel(v, format, range) })),
    xLabels: points.flatMap((p, i) =>
      i % labelEvery === 0
        ? [
            {
              x: x(i),
              label: p.label,
              sample: dense || p.sample === null ? null : integer(p.sample),
            },
          ]
        : [],
    ),
    line: points.flatMap((p, i) => (p.value === null ? [] : [`${x(i)},${y(p.value)}`])).join(' '),
    bands: bandPolygons(points, x, (v) => y(Math.min(range.max, Math.max(range.min, v)))),
    dots: points.flatMap((p, i) =>
      p.value === null
        ? []
        : [
            {
              x: x(i),
              y: y(p.value),
              radius: p.highlighted
                ? DOT_RADIUS.highlighted
                : dense
                  ? DOT_RADIUS.dense
                  : DOT_RADIUS.normal,
              small: p.faded ?? (p.sample !== null && p.sample < minSample),
              highlighted: p.highlighted,
              valueText: formatValue(p.value, format),
              label: p.label,
              detail: p.detail ?? null,
              sampleText: p.sample === null ? null : integer(p.sample),
            },
          ],
    ),
    // A marker sits between the previous point and its own, where the change happened.
    markers: markers
      .map((m) => ({ x: x(m.index) - slot / 2, label: m.label }))
      .filter((m) => m.x >= left),
    reference:
      reference === null
        ? null
        : { y: y(reference), label: `${referenceLabel} ${formatValue(reference, format)}` },
  };
}

/**
 * Confidence bands as SVG polygons: one per run of consecutive points that have both bounds, upper
 * edge left to right then lower edge back. Bounds are clamped to the axis so a wide band never hides
 * the scale. A run of a single point gets no band (a vertical sliver says nothing).
 */
export function bandPolygons(
  points: readonly LinePoint[],
  x: (index: number) => number,
  y: (value: number) => number,
): string[] {
  const runs: number[][] = [];
  let run: number[] = [];
  points.forEach((p, i) => {
    const bounded = p.value !== null && typeof p.low === 'number' && typeof p.high === 'number';
    if (bounded) {
      run.push(i);
    } else if (run.length) {
      runs.push(run);
      run = [];
    }
  });
  if (run.length) {
    runs.push(run);
  }
  return runs
    .filter((r) => r.length > 1)
    .map((r) => {
      const upper = r.map((i) => `${x(i)},${y(points[i].high as number)}`);
      const lower = [...r].reverse().map((i) => `${x(i)},${y(points[i].low as number)}`);
      return [...upper, ...lower].join(' ');
    });
}
