import { Rate } from '@core/common/common.model';

import { FindingMatch } from './findings.model';
import { rankByImpact } from './match-impact.utils';

function rate(count: number, total: number): Rate {
  return { count, total, value: total ? count / total : null };
}

function match(id: string, count: number, total: number, day = '01'): FindingMatch {
  return {
    matchId: id,
    sessionDay: `2026-10-${day}`,
    startedAt: `2026-10-${day}T21:00:00`,
    mapName: 'Ascent',
    roundsWon: 13,
    roundsLost: 7,
    rate: rate(count, total),
  };
}

const ids = (matches: FindingMatch[]) => matches.map((m) => m.matchId);

describe('rankByImpact', () => {
  it('puts the matches above the reference first when the squad is above it', () => {
    const ranked = rankByImpact(
      [match('a', 6, 7), match('b', 1, 2), match('c', 6, 6)],
      rate(13, 15),
      rate(32, 100),
    );
    expect(ids(ranked)).toEqual(['c', 'a', 'b']);
  });

  it('puts the matches below the reference first when the squad is below it', () => {
    const ranked = rankByImpact(
      [match('a', 8, 10), match('b', 1, 10), match('c', 4, 10)],
      rate(13, 30),
      rate(60, 100),
    );
    expect(ids(ranked)).toEqual(['b', 'c', 'a']);
  });

  it('tests against 50 % without opponents and sorts plain counts by size', () => {
    expect(ids(rankByImpact([match('a', 3, 10), match('b', 9, 10)], rate(12, 20), null))).toEqual([
      'b',
      'a',
    ]);
    expect(ids(rankByImpact([match('a', 1, 20), match('b', 4, 20)], null, null))).toEqual([
      'b',
      'a',
    ]);
  });

  it('keeps the newest match first on a tie', () => {
    const ranked = rankByImpact([match('old', 2, 4, '01'), match('new', 2, 4, '02')], null, null);
    expect(ids(ranked)).toEqual(['new', 'old']);
  });
});
