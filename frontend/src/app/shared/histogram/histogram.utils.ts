import { formatValue, integer, UNIT_SPACE } from '@core/format/value-format.utils';
import { linearScale } from '@shared/charts/chart-scale.utils';

import {
  BAR_GAP,
  HISTOGRAM_BOX,
  MEDIAN_LABEL_ROOM,
  SQUAD_COLOUR,
  TOP_COLOUR,
} from './histogram.constants';
import { HistogramInput, HistogramView, HistogramXLabel, MedianView } from './histogram.model';

/** '12 s', '17 m', '210 ACS': a rounded value with its unit. */
export function withUnit(value: number, unit: string): string {
  return `${integer(Math.round(value))}${UNIT_SPACE}${unit}`;
}

/** Share axis: steps of 10 points above 30 %, 5 points below, up to the highest bar. */
export function shareAxis(maxShare: number): { max: number; step: number } {
  const step = maxShare > 0.3 ? 0.1 : 0.05;
  const max = Math.max(step, Math.ceil(maxShare / step - 1e-9) * step);
  return { max: Number(max.toFixed(10)), step };
}

/** How many bins share one x axis label, so labels never touch. */
export function labelEvery(bins: number): number {
  return bins > 20 ? 3 : bins > 12 ? 2 : 1;
}

/**
 * Geometry of a histogram: one slot per bin, the squad as filled bars and top ranked as outlines,
 * both in shares so samples of different sizes compare; medians as dashed vertical lines placed on
 * the value axis (an open last bin counts as one bin wide).
 */
export function buildHistogram(input: HistogramInput): HistogramView | null {
  const { bins, binSize, unit, squad, top, squadName } = input;
  if (!bins.length) {
    return null;
  }
  const { width, height, left, right, top: plotTop, bottom } = HISTOGRAM_BOX;
  const shares = [...squad.shares, ...(top?.shares ?? [])].map((s) => s ?? 0);
  const axis = shareAxis(Math.max(0, ...shares));
  const y = linearScale([0, axis.max], [height - bottom, plotTop]);
  const slot = (width - left - right) / bins.length;
  const last = bins[bins.length - 1];
  const open = last.end === null;
  const low = bins[0].start;
  const high = open ? last.start + binSize : (last.end ?? last.start + binSize);
  const valueX = linearScale([low, high], [left, width - right]);
  const clampX = (value: number): number => valueX(Math.min(Math.max(value, low), high));
  const every = labelEvery(bins.length);

  const xLabels: HistogramXLabel[] = [];
  bins.forEach((bin, i) => {
    const x = left + i * slot;
    if (i === bins.length - 1 && open) {
      xLabels.push({ x: x + slot / 2, label: `${integer(bin.start)}+`, anchor: 'middle' });
    } else if (i % every === 0) {
      xLabels.push({ x, label: integer(bin.start), anchor: 'middle' });
    }
  });
  if (!open) {
    xLabels.push({ x: width - right, label: integer(high), anchor: 'end' });
  }

  const medians: MedianView[] = [];
  if (squad.median !== null) {
    medians.push({
      x: clampX(squad.median),
      label: `Médiane ${squadName} ${withUnit(squad.median, unit)}`,
      colour: SQUAD_COLOUR,
      shift: 0,
    });
  }
  if (top && top.median !== null) {
    const x = clampX(top.median);
    const close = medians.length > 0 && Math.abs(medians[0].x - x) < MEDIAN_LABEL_ROOM;
    medians.push({
      x,
      label: `Médiane top ranked ${withUnit(top.median, unit)}`,
      colour: TOP_COLOUR,
      shift: close ? 16 : 0,
    });
  }

  return {
    width,
    height,
    left,
    right,
    top: plotTop,
    bottom,
    yTicks: Array.from({ length: Math.round(axis.max / axis.step) + 1 }, (_, i) => {
      const share = i * axis.step;
      return { at: y(share), label: formatValue(share, 'pct') };
    }),
    bars: bins.map((bin, i) => {
      const x = left + i * slot;
      const share = squad.shares[i] ?? 0;
      const topShare = top ? (top.shares[i] ?? 0) : null;
      const base = height - bottom;
      return {
        x: x + BAR_GAP,
        width: Math.max(0, slot - 2 * BAR_GAP),
        y: y(share),
        height: Math.max(0, base - y(share)),
        topPath:
          topShare === null
            ? null
            : `M${x + BAR_GAP} ${base} V${y(topShare)} H${x + slot - BAR_GAP} V${base}`,
        label: bin.label,
        squadShare: formatValue(share, 'pct'),
        squadCount: integer(squad.counts[i] ?? 0),
        topShare: topShare === null ? null : formatValue(topShare, 'pct'),
        topCount: top ? integer(top.counts[i] ?? 0) : null,
      };
    }),
    xLabels,
    medians,
  };
}
