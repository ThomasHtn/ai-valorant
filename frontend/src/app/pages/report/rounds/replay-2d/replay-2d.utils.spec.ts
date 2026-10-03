import { describe, expect, it } from 'vitest';

import { RoundEvent } from '@core/report/rounds.model';

import { clampStep, replayMarkers } from './replay-2d.utils';

const event: RoundEvent = {
  ms: 1000,
  kind: 'kill',
  text: 'A tue B',
  actor: 'A',
  target: 'B',
  weapon: 'Vandal',
  zone: 'A Main',
  squadActor: true,
  ownAlive: 5,
  oppAlive: 4,
  winProbability: 0.6,
  positions: [
    { name: 'A', squad: true, x: 0.1, y: 0.1, alive: true },
    { name: 'C', squad: false, x: 0.2, y: 0.2, alive: true },
    { name: 'B', squad: false, x: 0.3, y: 0.3, alive: false },
  ],
};

describe('2D replay', () => {
  it('draws living players, the actor ringed and the victim crossed', () => {
    const markers = replayMarkers(event);
    expect(markers.map((m) => [m.id, m.shape, m.emphasis ?? false, m.label ?? null])).toEqual([
      ['A', 'player', true, 'A'],
      ['C', 'player', false, null],
      ['x-B', 'cross', false, 'B'],
    ]);
  });

  it('draws nothing without an event', () => {
    expect(replayMarkers(undefined)).toEqual([]);
  });

  it('keeps the step inside the round', () => {
    expect(clampStep(-1, 5)).toBe(0);
    expect(clampStep(9, 5)).toBe(4);
    expect(clampStep(2, 5)).toBe(2);
  });
});
