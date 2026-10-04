import { describe, expect, it } from 'vitest';

import { RoundStripCell } from '@core/report/matches.model';
import { RoundLine } from '@core/report/rounds.model';

import {
  matchesInOrder,
  matchNeighbours,
  scoreGaps,
  lossCauseCounts,
  lostRoundRows,
  matchLength,
  roundTip,
  startTime,
  stripItems,
} from './matches.utils';

function round(
  roundNumber: number,
  won: boolean,
  cause: RoundStripCell['cause'] = null,
): RoundStripCell {
  return {
    roundNumber,
    side: roundNumber <= 12 ? 'att' : 'def',
    won,
    buy: 'full',
    oppBuy: 'force',
    result: 'Elimination',
    ceremony: null,
    cause,
    maxAdvantage: 0,
    planted: false,
    plantSite: null,
  };
}

describe('matches view utils', () => {
  it('orders matches oldest first and finds the neighbours of one', () => {
    const summary = (matchId: string) => ({
      matchId,
      startedAt: '',
      mapName: 'Split',
      won: true,
      roundsWon: 13,
      roundsLost: 5,
      lengthMs: null,
      openingWon: 0,
      openingLost: 0,
      lineup: [],
    });
    const list = {
      evenings: [
        { day: '2026-09-30', wins: 2, losses: 0, matches: [summary('c'), summary('d')] },
        { day: '2026-09-28', wins: 2, losses: 0, matches: [summary('a'), summary('b')] },
      ],
    };
    expect(matchesInOrder(list).map((m) => m.match.matchId)).toEqual(['a', 'b', 'c', 'd']);
    const around = matchNeighbours(list, 'b');
    expect(around.previous?.match.matchId).toBe('a');
    expect(around.next?.match.matchId).toBe('c');
    expect(around.next?.day).toBe('2026-09-30');
    expect(matchNeighbours(list, 'a').previous).toBeNull();
    expect(matchNeighbours(null, 'a')).toEqual({ previous: null, next: null });
  });

  it('follows the score gap round after round', () => {
    expect(
      scoreGaps([{ won: true }, { won: true }, { won: false }, { won: false }, { won: false }]),
    ).toEqual([1, 2, 1, 0, -1]);
  });

  it('marks half time and each overtime swap', () => {
    const rounds = Array.from({ length: 27 }, (_, i) => round(i + 1, true));
    const swaps = stripItems(rounds).flatMap((item, i) => (item.kind === 'swap' ? [i] : []));
    // Before rounds 13, 25 and 27 (shifted by the swaps already inserted).
    expect(swaps).toEqual([12, 25, 28]);
  });

  it('counts lost rounds by cause, most frequent first', () => {
    const counts = lossCauseCounts([
      round(1, false, 'opening_lost'),
      round(2, false, 'opening_lost'),
      round(3, false, 'clutch_lost'),
      round(4, true),
    ]);
    expect(counts.map((c) => [c.label, c.count, c.share])).toEqual([
      ['Ouverture perdue', 2, 1],
      ['Clutch perdu', 1, 0.5],
    ]);
  });

  it('lists the lost rounds of one match in game order', () => {
    const line = (matchId: string, roundNumber: number, won: boolean) =>
      ({
        matchId,
        roundNumber,
        won,
        side: 'att',
        buy: 'full',
        oppBuy: 'eco',
        cause: 'lead_thrown',
        thrown: roundNumber === 3,
        bestProbability: 0.84,
      }) as RoundLine;
    const rows = lostRoundRows(
      [line('m', 7, false), line('m', 3, false), line('m', 5, true), line('x', 1, false)],
      'm',
    );
    expect(rows.map((r) => r.number)).toEqual(['R3', 'R7']);
    expect(rows[0]).toEqual({
      key: 'r3',
      link: ['/report/matches', 'm', 'rounds', '3'],
      number: 'R3',
      detail: 'Attaque, full buy contre eco',
      cause: 'Avantage perdu',
      chance: 'Throw à 84 %',
    });
    expect(rows[1].chance).toBeNull();
  });

  it('writes the round tip in French', () => {
    const tip = roundTip({ ...round(14, false, 'retake_failed'), maxAdvantage: 1 });
    expect(tip.title).toBe('Round 14 perdu');
    expect(tip.text).toBe('Défense, full buy contre force buy');
    expect(tip.lines).toContainEqual({ label: 'Cause', value: 'Retake raté' });
    expect(tip.lines).toContainEqual({ label: 'Avantage', value: '+1 au mieux' });
  });

  it('formats length and start time', () => {
    expect(matchLength(1868640)).toBe('31 min');
    expect(matchLength(null)).toBe('—');
    expect(startTime('2026-09-30T22:21:02+02:00')).toBe('22h21');
  });
});
