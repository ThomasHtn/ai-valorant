import { describe, expect, it } from 'vitest';

import { RoundEvent, RoundLine } from '@core/report/rounds.model';

import { bestMomentStep, chancesBefore, keyMoment } from './round-moments.utils';

function event(winProbability: number, ownAlive: number, oppAlive: number): RoundEvent {
  return {
    ms: 0,
    kind: 'kill',
    text: 'x',
    actor: 'a',
    target: 'b',
    weapon: null,
    zone: null,
    squadActor: false,
    ownAlive,
    oppAlive,
    winProbability,
    positions: [],
  };
}

describe('round moments', () => {
  const events = [event(0.7, 5, 4), event(0.4, 4, 4), event(0.15, 2, 4), event(0, 0, 4)];

  it('starts every round at 50 %', () => {
    expect(chancesBefore(events)).toEqual([0.5, 0.7, 0.4, 0.15]);
  });

  it('keeps the biggest fall of a lost round, not its last kill', () => {
    expect(keyMoment(events, false)).toEqual({ index: 1, from: 0.7, to: 0.4 });
  });

  it('keeps the biggest rise of a won round', () => {
    expect(keyMoment(events, true)).toEqual({ index: 0, from: 0.5, to: 0.7 });
  });

  it('leaves out a defuse', () => {
    const defuse = { ...event(0, 3, 2), kind: 'defuse' as const };
    expect(keyMoment([event(0.6, 5, 4), defuse], false)).toBeNull();
  });

  it('finds the event of the best chance', () => {
    const round = { bestState: '5v4', bestProbability: 0.7 } as RoundLine;
    expect(bestMomentStep(round, events)).toBe(0);
    expect(bestMomentStep({ ...round, bestState: '5v5' }, events)).toBeNull();
  });
});
