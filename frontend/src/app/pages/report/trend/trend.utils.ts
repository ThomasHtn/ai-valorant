import { dayMonth } from '@core/format/format.utils';
import { ValueFormat } from '@core/format/value-format.model';
import { wilsonInterval } from '@core/report/confidence-interval.utils';
import { TrendMetric, Trends, TrendValue } from '@core/report/trends.model';
import { ChartMarker, LinePoint } from '@shared/line-chart/line-chart.model';

import {
  Granularity,
  MATCH_METRIC,
  SHORT_MONTHS,
  TEAM_SUBJECT,
  TREND_HELP_FALLBACK,
  TREND_MAX_MARGIN,
  TREND_MIN_SAMPLE,
} from './trend.constants';

/** 'sept. 2026' from '2026-09'. */
export function monthLabel(key: string): string {
  return `${SHORT_MONTHS[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`;
}

/** Metrics the analyst can plot for the squad or for one player. */
export function metricsFor(trends: Trends, subject: string): TrendMetric[] {
  return subject === TEAM_SUBJECT ? trends.metrics : trends.playerMetrics;
}

/** Glossary key of a metric, filling the ones the API leaves empty. */
export function metricHelp(metric: TrendMetric): string | null {
  return metric.help ?? TREND_HELP_FALLBACK[metric.key] ?? null;
}

/**
 * Granularities with data: months always; patches for the squad only; matches only for the metric
 * stored per match (rounds won share for the squad, ACS for a player).
 */
export function availableGranularities(subject: string, metric: string): Set<Granularity> {
  const team = subject === TEAM_SUBJECT;
  const available = new Set<Granularity>(['month']);
  if (team) {
    available.add('patch');
  }
  if (metric === (team ? MATCH_METRIC.team : MATCH_METRIC.player)) {
    available.add('match');
  }
  return available;
}

/** Top ranked value drawn as the reference line: same role for a player, none for symmetric metrics. */
export function trendReference(trends: Trends, subject: string, metric: string): number | null {
  if (subject === TEAM_SUBJECT) {
    return trends.metrics.find((m) => m.key === metric)?.top ?? null;
  }
  return trends.players.find((p) => p.name === subject)?.top[metric] ?? null;
}

/**
 * A month or patch point: rates get their 95 % interval as a band and fade when it is wider than
 * TREND_MAX_MARGIN on a side; averages fade under TREND_MIN_SAMPLE.
 */
export function valuePoint(
  label: string,
  value: TrendValue | undefined,
  highlighted: boolean,
  format: ValueFormat,
): LinePoint {
  const v = value?.v ?? null;
  const n = value?.n ?? 0;
  if (format !== 'pct') {
    return { label, value: v, sample: n, highlighted, faded: n < TREND_MIN_SAMPLE };
  }
  const interval = wilsonInterval(v, n);
  const margin = interval && v !== null ? Math.max(v - interval.low, interval.high - v) : null;
  return {
    label,
    value: v,
    sample: n,
    highlighted,
    faded: margin === null || margin > TREND_MAX_MARGIN,
    low: interval?.low ?? null,
    high: interval?.high ?? null,
  };
}

/** Format of a metric for a subject, 'pct' when unknown. */
function metricFormat(trends: Trends, subject: string, metric: string): ValueFormat {
  return metricsFor(trends, subject).find((m) => m.key === metric)?.format ?? 'pct';
}

/** The points of the chart for a subject, a metric and a granularity, oldest first. */
export function trendPoints(
  trends: Trends,
  subject: string,
  metric: string,
  granularity: Granularity,
): LinePoint[] {
  const team = subject === TEAM_SUBJECT;
  const format = metricFormat(trends, subject, metric);
  if (granularity === 'patch') {
    return trends.byPatch.map((p) => valuePoint(p.key, p.values[metric], p.inPeriod, format));
  }
  if (granularity === 'match') {
    return trends.series.map((m) => ({
      label: dayMonth(m.day),
      detail: `${m.mapName} ${m.roundsWon}-${m.roundsLost}`,
      value: team ? m.roundsWon / (m.roundsWon + m.roundsLost) : (m.acs[subject] ?? null),
      sample: team ? m.roundsWon + m.roundsLost : null,
      highlighted: m.inPeriod,
      // One match is always a small sample: the series reads as a whole, no point is faded.
      faded: false,
    }));
  }
  const months = team
    ? trends.byMonth
    : (trends.players.find((p) => p.name === subject)?.byMonth ?? []);
  return months.map((p) => valuePoint(monthLabel(p.key), p.values[metric], p.inPeriod, format));
}

/**
 * Patch changes as chart markers. Per match: before the first match of each patch. Per month: on the
 * month the patch arrived, several patches of one month sharing a marker. Per patch: none (each point
 * is already a patch). The first patch of the history marks no change.
 */
export function trendMarkers(trends: Trends, granularity: Granularity): ChartMarker[] {
  const changes = trends.patchMarkers.slice(1);
  if (granularity === 'match') {
    return changes.map((m) => ({ index: m.index, label: m.patch }));
  }
  if (granularity === 'patch') {
    return [];
  }
  const months = trends.byMonth.map((p) => p.key);
  const markers: ChartMarker[] = [];
  for (const change of changes) {
    const index = months.indexOf(change.day.slice(0, 7));
    if (index <= 0) {
      continue;
    }
    const same = markers.find((m) => m.index === index);
    if (same) {
      same.label = `${same.label}, ${change.patch}`;
    } else {
      markers.push({ index, label: change.patch });
    }
  }
  return markers;
}

/** Latest month of the period and its value, for the small multiples' figure. */
export function periodValue(
  trends: Trends,
  metric: string,
): { month: string; value: number | null } | null {
  const point = trends.byMonth.filter((p) => p.inPeriod).at(-1);
  return point ? { month: point.key, value: point.values[metric]?.v ?? null } : null;
}

/** Drawing of a small multiple, in a fixed viewBox stretched to its box. */
export interface SparklineView {
  width: number;
  height: number;
  line: string;
  dots: { x: number; y: number; highlighted: boolean; small: boolean }[];
  referenceY: number | null;
}

/** Box of a small multiple; stretched to the tile's width (preserveAspectRatio none). */
const SPARK = { width: 220, height: 52, pad: 6 };

/** Small multiple of a series: min to max of the values (and the reference) on the full height; faded points stay faded. */
export function sparkline(
  points: readonly LinePoint[],
  reference: number | null,
): SparklineView | null {
  const values = points.flatMap((p) => (p.value === null ? [] : [p.value]));
  if (reference !== null) {
    values.push(reference);
  }
  if (!values.length) {
    return null;
  }
  const low = Math.min(...values);
  const high = Math.max(...values) === low ? low + 1 : Math.max(...values);
  const { width, height, pad } = SPARK;
  const x = (i: number): number => pad + ((width - 2 * pad) * i) / Math.max(1, points.length - 1);
  const y = (v: number): number => pad + (height - 2 * pad) * (1 - (v - low) / (high - low));
  const dots = points.flatMap((p, i) =>
    p.value === null
      ? []
      : [
          {
            x: x(i),
            y: y(p.value),
            highlighted: p.highlighted,
            small: p.faded ?? false,
          },
        ],
  );
  return {
    width,
    height,
    line: dots.map((d) => `${d.x},${d.y}`).join(' '),
    dots,
    referenceY: reference === null ? null : y(reference),
  };
}
