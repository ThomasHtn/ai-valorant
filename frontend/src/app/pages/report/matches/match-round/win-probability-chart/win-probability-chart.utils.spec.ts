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
  const model = chartModel(events, 1, { index: 1, from: 0.7, to: 0.3 });
  const { left, right, width } = CHART_SIZE;
  const scale = (width - left - right) / 40_000;

  it("ends the time axis at the round's last event", () => {
    expect(model.ticks.map((t) => t.label)).toEqual(['0:00', '0:20', '0:40']);
  });

  it('draws plants and defuses as spike markers', () => {
    const plant = { ...event(20_000, 0.6, true), kind: 'plant' as const };
    expect(chartModel([plant], 0, null).points[0].spike).toBe(true);
    expect(model.points[0].spike).toBe(false);
  });

  it('starts at 50 % and steps at each event', () => {
    expect(model.path.startsWith(`M${left},`)).toBe(true);
    expect(model.points[0].x).toBeCloseTo(left + 10_000 * scale);
  });

  it('marks the key moment', () => {
    expect(model.key?.label).toBe('Moment clé −40 pts');
    expect(model.key?.x).toBeCloseTo(left + 30_000 * scale);
    expect(model.key?.anchor).toBe('start');
    expect(model.key?.color).toContain('bad');
  });

  it('writes the key moment label left of its line at the end of the round', () => {
    const late = chartModel([event(10_000, 0.6, true), event(40_000, 0.9, true)], 0, {
      index: 1,
      from: 0.6,
      to: 0.9,
    });
    expect(late.key?.label).toBe('Moment clé +30 pts');
    expect(late.key?.anchor).toBe('end');
    expect(late.key?.labelX).toBeLessThan(late.key?.x ?? 0);
  });

  it('draws no key line without a key moment', () => {
    expect(chartModel(events, 0, null).key).toBeNull();
  });

  it('puts the cursor on the selected event', () => {
    expect(model.cursorX).toBeCloseTo(left + 30_000 * scale);
  });

  it('colours kills and deaths', () => {
    expect(eventColor(events[0])).toContain('good');
    expect(eventColor(events[1])).toContain('bad');
  });
});
