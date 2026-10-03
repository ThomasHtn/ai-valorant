import { describe, expect, it } from 'vitest';

import { RoundStripCell } from '@core/report/matches.model';
import { RoundLine } from '@core/report/rounds.model';

import {
  defaultMatchId,
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
  it('opens the latest match of the newest evening', () => {
    const list = {
      evenings: [
        {
          day: '2026-09-30',
          wins: 1,
          losses: 1,
          matches: [
            {
              matchId: 'a',
              startedAt: '',
              mapName: 'Split',
              won: true,
              roundsWon: 13,
              roundsLost: 5,
            },
            {
              matchId: 'b',
              startedAt: '',
              mapName: 'Lotus',
              won: false,
              roundsWon: 5,
              roundsLost: 13,
            },
          ],
        },
      ],
    };
    expect(defaultMatchId(list)).toBe('b');
    expect(defaultMatchId(null)).toBeNull();
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
      link: ['/report/rounds', 'm_3'],
      number: 'R3',
      detail: 'Attaque · full buy contre eco',
      cause: 'Avantage perdu',
      chance: 'avait 84 %',
    });
    expect(rows[1].chance).toBeNull();
  });

  it('writes the round tip in French', () => {
    const tip = roundTip({ ...round(14, false, 'retake_failed'), maxAdvantage: 1 });
    expect(tip.title).toBe('Round 14 · perdu');
    expect(tip.text).toBe('Défense · full buy contre force buy');
    expect(tip.lines).toContainEqual({ label: 'Cause', value: 'Retake raté' });
    expect(tip.lines).toContainEqual({ label: 'Avantage', value: '+1 au mieux' });
  });

  it('formats length and start time', () => {
    expect(matchLength(1868640)).toBe('31 min');
    expect(matchLength(null)).toBe('—');
    expect(startTime('2026-09-30T22:21:02+02:00')).toBe('22h21');
  });
});
