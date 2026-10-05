import { formatValue } from '@core/format/value-format.utils';

import { MONTH_BOX, MONTH_GRID_STEP, MONTH_INSET, MONTH_RANGE_PAD } from './month-chart.constants';
import { MonthChartView, MonthSeries, MonthTick, MonthTipLine } from './month-chart.model';

type Point = [number, number];

const round = (n: number) => Math.round(n * 10) / 10;

/** Range of the y axis: every value and the reference, padded and snapped to the grid step. */
export function monthRange(
  series: readonly MonthSeries[],
  reference: number | null,
): [number, number] {
  const values = series.flatMap((s) => s.values).filter((v): v is number => v !== null);
  if (reference !== null) {
    values.push(reference);
  }
  if (!values.length) {
    return [0, 1];
  }
  const step = MONTH_GRID_STEP;
  const low = Math.max(0, Math.floor((Math.min(...values) - MONTH_RANGE_PAD) / step) * step);
  const high = Math.min(1, Math.ceil((Math.max(...values) + MONTH_RANGE_PAD) / step) * step);
  return high > low ? [round(low * 100) / 100, round(high * 100) / 100] : [0, 1];
}

/** Smooth curve through points (Catmull-Rom as cubic Béziers), in box units. */
export function smoothPath(points: readonly Point[]): string {
  let d = `M${round(points[0][0])} ${round(points[0][1])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1: Point = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Point = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${round(c1[0])} ${round(c1[1])} ${round(c2[0])} ${round(c2[1])} ${round(p2[0])} ${round(p2[1])}`;
  }
  return d;
}

/** Lines, dots, gridlines and axis labels of a month chart. */
export function buildMonthChart(
  series: readonly MonthSeries[],
  ticks: readonly MonthTick[],
  reference: number | null,
): MonthChartView {
  const [min, max] = monthRange(series, reference);
  const count = ticks.length;
  const x = (i: number) =>
    count > 1
      ? MONTH_INSET + (i * (MONTH_BOX.width - 2 * MONTH_INSET)) / (count - 1)
      : MONTH_BOX.width / 2;
  const y = (v: number) => MONTH_BOX.height - ((v - min) / (max - min)) * MONTH_BOX.height;

  const grid: MonthChartView['grid'] = [];
  for (let v = min; v <= max + 1e-9; v += MONTH_GRID_STEP) {
    grid.push({ y: round(y(v)), label: formatValue(v, 'pct') });
  }

  const paths = series.flatMap((s) =>
    runs(s.values).map((run, index) => {
      const points = run.map((i): Point => [x(i), y(s.values[i] ?? 0)]);
      const line = points.length > 1 ? smoothPath(points) : '';
      const last = points[points.length - 1];
      const area =
        s.area && points.length > 1
          ? `${line} L${round(last[0])} ${MONTH_BOX.height} L${round(points[0][0])} ${MONTH_BOX.height} Z`
          : null;
      return { key: `${s.key}-${index}`, color: s.color, line, area };
    }),
  );

  const dots = series.flatMap((s) =>
    s.values.flatMap((v, i) =>
      v === null
        ? []
        : [
            {
              key: `${s.key}-${i}`,
              x: round(x(i) / (MONTH_BOX.width / 100)),
              y: round(y(v)),
              color: s.color,
              faded: ticks[i]?.faded ?? false,
              text: formatValue(v, 'pct'),
            },
          ],
    ),
  );

  return {
    grid,
    reference: reference === null ? null : round(y(Math.min(max, Math.max(min, reference)))),
    paths,
    dots,
    ticks: ticks.map((t, i) => {
      const at = (j: number) => x(j) / (MONTH_BOX.width / 100);
      const from = i === 0 ? 0 : (at(i - 1) + at(i)) / 2;
      const to = i === count - 1 ? 100 : (at(i) + at(i + 1)) / 2;
      return {
        key: t.key,
        x: round(at(i)),
        label: t.label,
        sample: t.sample,
        from: round(from),
        width: round(to - from),
      };
    }),
  };
}

/** Each series' value for one month, as the hover tip lists them; months without a value are left out. */
export function monthTipLines(series: readonly MonthSeries[], index: number): MonthTipLine[] {
  return series.flatMap((s) => {
    const value = s.values[index];
    if (value === null || value === undefined) {
      return [];
    }
    return [
      {
        key: s.key,
        label: s.label,
        color: s.color,
        value: s.details?.[index] ?? formatValue(value, 'pct'),
      },
    ];
  });
}

/** Indexes of the values, grouped in runs of consecutive non-null values. */
function runs(values: readonly (number | null)[]): number[][] {
  const out: number[][] = [];
  let current: number[] = [];
  values.forEach((v, i) => {
    if (v === null) {
      if (current.length) {
        out.push(current);
      }
      current = [];
    } else {
      current.push(i);
    }
  });
  if (current.length) {
    out.push(current);
  }
  return out;
}
