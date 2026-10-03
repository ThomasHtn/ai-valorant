import { clock } from '@core/format/format.utils';
import { RoundEvent } from '@core/report/rounds.model';

import { KeyMoment } from '../round-moments.model';
import {
  CHART_SIZE,
  KEY_LABEL_WIDTH,
  MIN_AXIS_MS,
  START_PROBABILITY,
  TICK_STEP_MS,
} from './win-probability-chart.constants';

export interface ChartPoint {
  x: number;
  y: number;
  index: number;
  /** CSS colour: green for a squad kill, red for a squad death, amber for a plant or a defuse. */
  color: string;
  /** Plants and defuses are drawn as diamonds, kills as dots. */
  spike: boolean;
  label: string;
}

export interface ChartModel {
  /** Step line of the squad's chance of winning. */
  path: string;
  grid: { y: number; label: string; dashed: boolean }[];
  ticks: { x: number; label: string }[];
  points: ChartPoint[];
  /** Key moment line; its label sits left of the line when the line is near the right edge. */
  key: {
    x: number;
    label: string;
    labelX: number;
    anchor: 'start' | 'end';
    color: string;
  } | null;
  /** Position of the event shown in the replay. */
  cursorX: number | null;
  top: number;
  bottom: number;
}

/** Colour of an event point. */
export function eventColor(event: RoundEvent): string {
  if (event.kind !== 'kill') {
    return 'var(--color-brand-500)';
  }
  return event.squadActor ? 'var(--color-rating-good)' : 'var(--color-rating-bad)';
}

/**
 * Geometry of the win probability chart: a step line from 50 % at 0:00 to the round's last event, one
 * point per event (a diamond for the spike), a line on the key moment, and a cursor on the selected
 * event.
 */
export function chartModel(
  events: readonly RoundEvent[],
  step: number,
  key: KeyMoment | null,
  width = CHART_SIZE.width,
): ChartModel {
  const { height, left, right, top, bottom } = CHART_SIZE;
  const maxMs = Math.max(MIN_AXIS_MS, ...events.map((e) => e.ms));
  const x = (ms: number): number => left + (ms / maxMs) * (width - left - right);
  const y = (p: number): number => top + (1 - p) * (height - top - bottom);

  let path = `M${x(0)},${y(START_PROBABILITY)}`;
  const points = events.map((event, index) => {
    path += ` H${x(event.ms)} V${y(event.winProbability)}`;
    return {
      x: x(event.ms),
      y: y(event.winProbability),
      index,
      color: eventColor(event),
      spike: event.kind !== 'kill',
      label: `${clock(event.ms)} · ${event.text} · ${Math.round(event.winProbability * 100)} %`,
    };
  });
  path += ` H${x(maxMs)}`;

  const ticks = [];
  for (let ms = 0; ms <= maxMs; ms += TICK_STEP_MS) {
    ticks.push({ x: x(ms), label: clock(ms) });
  }
  const current = events[step];
  return {
    path,
    grid: [0, 0.5, 1].map((p) => ({ y: y(p), label: `${p * 100} %`, dashed: p === 0.5 })),
    ticks,
    points,
    key: key ? keyMarker(x(events[key.index].ms), key, width - right) : null,
    cursorX: current ? x(current.ms) : null,
    top,
    bottom: height - bottom,
  };
}

/** The key moment's line and label, kept inside the chart: flipped to the left near the right edge. */
function keyMarker(lineX: number, key: KeyMoment, plotEnd: number): ChartModel['key'] {
  const flip = plotEnd - lineX < KEY_LABEL_WIDTH;
  const points = Math.round((key.to - key.from) * 100);
  return {
    x: lineX,
    label: `Moment clé ${points > 0 ? '+' : '−'}${Math.abs(points)} pts`,
    labelX: flip ? lineX - 4 : lineX + 4,
    anchor: flip ? 'end' : 'start',
    color: points > 0 ? 'var(--color-rating-good)' : 'var(--color-rating-bad)',
  };
}
