import { describe, expect, it } from 'vitest';

import { RoundStripCell } from '@core/report/matches.model';

import { halfScores } from './match-header.utils';

function round(roundNumber: number, won: boolean): RoundStripCell {
  return {
    roundNumber,
    side: roundNumber <= 12 ? 'def' : 'att',
    won,
    buy: 'full',
    oppBuy: 'full',
    result: 'Elimination',
    ceremony: null,
    cause: null,
    maxAdvantage: 0,
    planted: false,
    plantSite: null,
  };
}

describe('halfScores', () => {
  it('splits regulation by side and keeps the overtime apart', () => {
    const rounds = Array.from({ length: 26 }, (_, i) => round(i + 1, i % 2 === 0));
    expect(halfScores(rounds)).toEqual([
      { key: 'first', label: 'Défense', side: 'def', won: 6, lost: 6 },
      { key: 'second', label: 'Attaque', side: 'att', won: 6, lost: 6 },
      { key: 'overtime', label: 'Prolongation', side: null, won: 1, lost: 1 },
    ]);
  });

  it('skips the halves not played yet', () => {
    expect(halfScores([round(1, true)])).toEqual([
      { key: 'first', label: 'Défense', side: 'def', won: 1, lost: 0 },
    ]);
  });
});
