import { describe, expect, it } from 'vitest';

import { RoundLine } from '@core/report/rounds.model';

import { DEFAULT_ROUND_FILTERS } from './rounds-filter.constants';
import { filterOptions, filterRounds, queryScope } from './rounds-filter.utils';

function line(partial: Partial<RoundLine>): RoundLine {
  return {
    matchId: 'm',
    roundNumber: 1,
    day: '2026-09-30',
    startedAt: '2026-09-30T21:00:00+02:00',
    mapName: 'Split',
    side: 'att',
    buy: 'full',
    oppBuy: 'full',
    scoreBefore: '0-0',
    won: false,
    result: 'Elimination',
    cause: 'opening_lost',
    maxAdvantage: 0,
    bestState: null,
    bestProbability: null,
    ...partial,
  };
}

describe('rounds filters', () => {
  const rounds = [
    line({ roundNumber: 1 }),
    line({ roundNumber: 2, won: true, cause: null }),
    line({ roundNumber: 3, mapName: 'Lotus', side: 'def', cause: 'clutch_lost' }),
  ];

  it('shows lost rounds by default', () => {
    expect(filterRounds(rounds, DEFAULT_ROUND_FILTERS, []).map((r) => r.roundNumber)).toEqual([
      1, 3,
    ]);
  });

  it('reads a map and a side from a clicked cell', () => {
    const scope = queryScope({ title: '', text: 'lotus défense' }, ['Lotus', 'Split']);
    expect(scope).toEqual({ map: 'Lotus', side: 'def' });
    expect(filterRounds(rounds, DEFAULT_ROUND_FILTERS, [scope]).map((r) => r.roundNumber)).toEqual([
      3,
    ]);
  });

  it('ignores a cell naming several maps', () => {
    expect(queryScope({ title: '', text: 'lotus split' }, ['Lotus', 'Split']).map).toBe('');
  });

  it("lets the view's own filters win over the scope", () => {
    const filters = { ...DEFAULT_ROUND_FILTERS, map: 'Split' };
    const kept = filterRounds(rounds, filters, [{ map: 'Lotus', side: '' }]);
    expect(kept.map((r) => r.roundNumber)).toEqual([1]);
  });

  it('lists causes and maps', () => {
    expect(filterOptions(rounds)).toEqual({
      causes: ['clutch_lost', 'opening_lost'],
      maps: ['Lotus', 'Split'],
    });
  });
});
