import { describe, expect, it } from 'vitest';

import { RoundLine } from '@core/report/rounds.model';

import { buyMatrix, costlyMoments, momentKeys } from './rounds-overview.utils';

function round(n: number, won: boolean, extra: Partial<RoundLine> = {}): RoundLine {
  return {
    matchId: 'm1',
    roundNumber: n,
    day: '2026-09-30',
    startedAt: '',
    mapName: 'Split',
    side: n <= 12 ? 'att' : 'def',
    buy: n === 1 || n === 13 ? 'pistol' : 'full',
    oppBuy: 'full',
    scoreBefore: '0-0',
    won,
    result: '',
    cause: null,
    maxAdvantage: 0,
    bestState: null,
    bestProbability: null,
    maxDrop: 0,
    thrown: false,
    ...extra,
  };
}

describe('rounds overview', () => {
  const rounds = [
    round(1, false),
    round(2, true),
    round(3, false),
    round(4, false),
    round(5, false),
    round(6, false),
    round(7, true, { thrown: false }),
    round(13, true),
    round(14, true),
    round(15, false, { thrown: true }),
  ];

  it('finds losing streaks, the round after a lost pistol and the bonus round', () => {
    expect([...momentKeys(rounds, 'streak')]).toEqual(['m1_3', 'm1_4', 'm1_5', 'm1_6']);
    expect([...momentKeys(rounds, 'after_pistol_loss')]).toEqual(['m1_2']);
    expect([...momentKeys(rounds, 'bonus')]).toEqual(['m1_15']);
  });

  it('sums the costly moments', () => {
    const moments = Object.fromEntries(costlyMoments(rounds).map((m) => [m.key, m.figure]));
    expect(moments).toMatchObject({
      pistols: '1 sur 2',
      bonus: '0 sur 1',
      streak: '1',
      throws: '1',
    });
  });

  it('colours a map cell against every map, never the total rows', () => {
    const other = Array.from({ length: 6 }, (_, i) =>
      round(i + 2, true, { matchId: 'm2', mapName: 'Lotus' }),
    );
    const rows = buyMatrix([...rounds, ...other]);
    const splitAttack = rows.find((r) => r.map === 'Split' && r.side === 'att')!;
    expect(splitAttack.cells.find((c) => c.buy === 'full')).toMatchObject({
      won: 2,
      played: 6,
      tone: 'bad',
    });
    expect(rows.filter((r) => !r.map).every((r) => r.total.tone !== 'bad')).toBe(true);
  });
});
