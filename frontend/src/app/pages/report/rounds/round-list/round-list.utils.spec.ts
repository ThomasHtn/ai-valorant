import { describe, expect, it } from 'vitest';

import { RoundLine } from '@core/report/rounds.model';

import { roundOutcome } from './round-list.utils';

const round = {
  won: false,
  cause: 'clutch_lost',
  bestProbability: 0.78,
  thrown: true,
} as RoundLine;

describe('round list outcome', () => {
  it('names the cause of a lost round and the chance it had', () => {
    expect(roundOutcome(round)).toEqual({
      outcome: 'Clutch perdu',
      won: false,
      chance: 'Throw à 78 %',
    });
  });

  it('shows no chance when the round was not in hand', () => {
    expect(roundOutcome({ ...round, thrown: false }).chance).toBeNull();
  });

  it('marks a won round', () => {
    expect(roundOutcome({ ...round, won: true, cause: null, thrown: false }).outcome).toBe('Gagné');
  });
});
