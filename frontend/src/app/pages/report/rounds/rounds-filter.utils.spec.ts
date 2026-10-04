import { describe, expect, it } from 'vitest';

import { RoundLine } from '@core/report/rounds.model';

import { DEFAULT_ROUND_FILTERS } from './rounds-filter.constants';
import {
  causeCounts,
  effectiveSort,
  filterMaps,
  filterRounds,
  matchLabel,
  queryScope,
  readRoundParams,
  roundParams,
  sortRounds,
} from './rounds-filter.utils';

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
    maxDrop: 0,
    thrown: false,
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

  it('limits the list to the match it came from', () => {
    const list = [line({ roundNumber: 1, matchId: 'a' }), line({ roundNumber: 2, matchId: 'b' })];
    const filters = { ...DEFAULT_ROUND_FILTERS, match: 'b' };
    expect(filterRounds(list, filters, []).map((r) => r.roundNumber)).toEqual([2]);
    expect(readRoundParams({ match: 'b' }, DEFAULT_ROUND_FILTERS).filters.match).toBe('b');
    expect(roundParams(filters, 'date').match).toBe('b');
  });

  it('names the match with its score', () => {
    const list = [line({ won: true }), line({ won: false }), line({ won: false })];
    expect(matchLabel(list, 'm')).toBe('Match Split 1-2 du 30/09');
  });

  it('lists the maps of the period', () => {
    expect(filterMaps(rounds)).toEqual(['Lotus', 'Split']);
  });

  it('counts lost rounds by cause, most frequent first, as a part of every lost round', () => {
    const list = [
      ...rounds,
      line({ roundNumber: 4, cause: 'clutch_lost' }),
      line({ roundNumber: 5, cause: null }),
    ];
    expect(causeCounts(list)).toEqual([
      { cause: 'clutch_lost', label: 'Clutch perdu', count: 2, share: 0.5 },
      { cause: 'opening_lost', label: 'Ouverture perdue', count: 1, share: 0.25 },
    ]);
  });

  it('keeps the throws only with the throws filter', () => {
    const list = [line({ roundNumber: 1, thrown: true }), line({ roundNumber: 2 })];
    const filters = { ...DEFAULT_ROUND_FILTERS, result: 'thrown' as const };
    expect(filterRounds(list, filters, []).map((r) => r.roundNumber)).toEqual([1]);
  });

  it('sorts by the best chance the squad had', () => {
    const list = [
      line({ roundNumber: 1, bestProbability: 0.4 }),
      line({ roundNumber: 2, bestProbability: 0.8 }),
      line({ roundNumber: 3 }),
    ];
    expect(sortRounds(list, 'chance').map((r) => r.roundNumber)).toEqual([2, 1, 3]);
    expect(sortRounds(list, 'date').map((r) => r.roundNumber)).toEqual([1, 2, 3]);
  });

  it('sorts by throw size on lost rounds only', () => {
    expect(effectiveSort('lost', 'chance')).toBe('chance');
    expect(effectiveSort('thrown', 'chance')).toBe('chance');
    expect(effectiveSort('won', 'chance')).toBe('date');
    expect(effectiveSort('all', 'chance')).toBe('date');
  });

  it('reads a deep link from another view', () => {
    const { filters, sort } = readRoundParams(
      { map: 'Split', side: 'def', result: 'lost', preset: 'throws', player: 'x' } as never,
      DEFAULT_ROUND_FILTERS,
    );
    expect(filters).toEqual({
      ...DEFAULT_ROUND_FILTERS,
      map: 'Split',
      side: 'def',
      result: 'thrown',
    });
    expect(sort).toBe('date');
    expect(readRoundParams({ result: 'won' }, DEFAULT_ROUND_FILTERS).filters.result).toBe('won');
    expect(readRoundParams({}, DEFAULT_ROUND_FILTERS).filters.result).toBe('lost');
  });

  it('writes only what differs from the defaults', () => {
    expect(
      roundParams({ ...DEFAULT_ROUND_FILTERS, result: 'thrown', map: 'Split' }, 'chance'),
    ).toEqual({
      match: null,
      map: 'Split',
      side: null,
      result: null,
      preset: 'throws',
      cause: null,
      buy: null,
      moment: null,
      sort: 'chance',
    });
  });
});
