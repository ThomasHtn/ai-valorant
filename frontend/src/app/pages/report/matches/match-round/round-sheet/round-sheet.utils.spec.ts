import { describe, expect, it } from 'vitest';

import { RoundEvent, RoundLine } from '@core/report/rounds.model';

import { roundSummary } from './round-sheet.utils';

const round = {
  won: false,
  result: 'Elimination',
  cause: 'clutch_lost',
  bestState: '4v4',
  bestProbability: 0.48,
} as RoundLine;

const events = [
  { ms: 17_000, text: 'A tue B', ownAlive: 4, oppAlive: 4, winProbability: 0.48 },
  { ms: 29_000, text: 'C tue D', ownAlive: 3, oppAlive: 4, winProbability: 0.22 },
] as RoundEvent[];

describe('round sheet summary', () => {
  const summary = roundSummary(round, events, { index: 1, from: 0.48, to: 0.22 });

  it('says how the round ended and why it was lost', () => {
    expect(summary.outcome).toBe('Perdu · Élimination');
    expect(summary.cause).toEqual({
      label: 'Clutch perdu',
      reason: "le round est allé jusqu'au 1v1",
    });
  });

  it('dates the best moment with its event', () => {
    expect(summary.best).toEqual({ text: '48 % de chances en 4v4 à 0:17', step: 0 });
  });

  it('names the start of the round when nothing went better', () => {
    const start = roundSummary({ ...round, bestState: '5v5', bestProbability: 0.52 }, events, null);
    expect(start.best).toEqual({ text: '52 % de chances en 5v5, au début du round', step: null });
    expect(start.key).toBeNull();
  });

  it('writes the key moment with the move of the chance', () => {
    expect(summary.key).toEqual({ text: '0:29, C tue D : 48 → 22 %', step: 1 });
  });
});
