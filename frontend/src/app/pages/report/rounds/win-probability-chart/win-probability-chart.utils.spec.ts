import { describe, expect, it } from 'vitest';

import { RoundEvent } from '@core/report/rounds.model';

import { CHART_SIZE } from './win-probability-chart.constants';
import { chartModel, eventColor } from './win-probability-chart.utils';

function event(ms: number, winProbability: number, squadActor: boolean): RoundEvent {
  return {
    ms,
    kind: 'kill',
    text: 'x',
    actor: 'a',
    target: 'b',
    weapon: null,
    zone: null,
    squadActor,
    ownAlive: 5,
    oppAlive: 4,
    winProbability,
    positions: [],
  };
}

describe('win probability chart', () => {
  const events = [event(10_000, 0.7, true), event(30_000, 0.3, false), event(40_000, 0.2, false)];
  const model = chartModel(events, 1);
  const { left, right, width } = CHART_SIZE;
  const scale = (width - left - right) / 100_000;

  it('spans at least a full round on the time axis', () => {
    expect(model.ticks.map((t) => t.label)).toEqual([
      '0:00',
      '0:20',
      '0:40',
      '1:00',
      '1:20',
      '1:40',
    ]);
  });

  it('starts at 50 % and steps at each event', () => {
    expect(model.path.startsWith(`M${left},`)).toBe(true);
    expect(model.points[0].x).toBeCloseTo(left + 10_000 * scale);
  });

  it('marks the biggest fall as the turning point', () => {
    expect(model.drop?.label).toBe('Bascule −40 pts');
    expect(model.drop?.x).toBeCloseTo(left + 30_000 * scale);
  });

  it('puts the cursor on the selected event', () => {
    expect(model.cursorX).toBeCloseTo(left + 30_000 * scale);
  });

  it('colours kills and deaths', () => {
    expect(eventColor(events[0])).toContain('good');
    expect(eventColor(events[1])).toContain('bad');
  });
});
