import { clock } from '@core/format/format.utils';
import { RoundEvent } from '@core/report/rounds.model';

import {
  CHART_SIZE,
  MIN_ROUND_MS,
  START_PROBABILITY,
  TICK_STEP_MS,
} from './win-probability-chart.constants';

export interface ChartPoint {
  x: number;
  y: number;
  index: number;
  /** CSS colour: green for a squad kill, red for a squad death, grey for a plant or a defuse. */
  color: string;
  label: string;
}

export interface ChartModel {
  /** Step line of the squad's chance of winning. */
  path: string;
  grid: { y: number; label: string; dashed: boolean }[];
  ticks: { x: number; label: string }[];
  points: ChartPoint[];
  /** Event that made the chance fall the most, if any fell. */
  drop: { x: number; label: string } | null;
  /** Position of the event shown in the replay. */
  cursorX: number | null;
  top: number;
  bottom: number;
}

/** Colour of an event point. */
export function eventColor(event: RoundEvent): string {
  if (event.kind !== 'kill') {
    return 'var(--color-text-secondary)';
  }
  return event.squadActor ? 'var(--color-rating-good)' : 'var(--color-rating-bad)';
}

/**
 * Geometry of the win probability chart: a step line from 50 % at 0:00, one point per event, the
 * biggest fall marked as the turning point, and a cursor on the selected event.
 */
export function chartModel(events: readonly RoundEvent[], step: number): ChartModel {
  const { width, height, left, right, top, bottom } = CHART_SIZE;
  const maxMs = Math.max(MIN_ROUND_MS, ...events.map((e) => e.ms));
  const x = (ms: number): number => left + (ms / maxMs) * (width - left - right);
  const y = (p: number): number => top + (1 - p) * (height - top - bottom);

  let path = `M${x(0)},${y(START_PROBABILITY)}`;
  let previous = START_PROBABILITY;
  let drop: { index: number; size: number } | null = null;
  const points = events.map((event, index) => {
    path += ` H${x(event.ms)} V${y(event.winProbability)}`;
    const fall = previous - event.winProbability;
    if (fall > 0 && (!drop || fall > drop.size)) {
      drop = { index, size: fall };
    }
    previous = event.winProbability;
    return {
      x: x(event.ms),
      y: y(event.winProbability),
      index,
      color: eventColor(event),
      label: `${clock(event.ms)} · ${event.text} · ${Math.round(event.winProbability * 100)} %`,
    };
  });
  path += ` H${x(maxMs)}`;

  const ticks = [];
  for (let ms = 0; ms <= maxMs; ms += TICK_STEP_MS) {
    ticks.push({ x: x(ms), label: clock(ms) });
  }
  const turning = drop as { index: number; size: number } | null;
  const current = events[step];
  return {
    path,
    grid: [0, 0.5, 1].map((p) => ({ y: y(p), label: `${p * 100} %`, dashed: p === 0.5 })),
    ticks,
    points,
    drop: turning
      ? { x: x(events[turning.index].ms), label: `Bascule −${Math.round(turning.size * 100)} pts` }
      : null,
    cursorX: current ? x(current.ms) : null,
    top,
    bottom: height - bottom,
  };
}
