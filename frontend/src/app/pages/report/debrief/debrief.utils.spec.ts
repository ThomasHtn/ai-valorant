import { describe, expect, it } from 'vitest';

import { UNIT_SPACE } from '@core/format/value-format.utils';
import { EveningMatches } from '@core/report/matches.model';
import { RoundLine } from '@core/report/rounds.model';

import { debriefTiles, playerForms, turningRounds } from './debrief.utils';

function round(n: number, won: boolean, extra: Partial<RoundLine> = {}): RoundLine {
  return {
    matchId: 'm1',
    roundNumber: n,
    day: '2026-09-30',
    startedAt: '',
    mapName: 'Split',
    side: 'att',
    buy: 'full',
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

function evening(lineups: [string, string, number, number, number][]): EveningMatches {
  return {
    day: '2026-09-30',
    wins: 1,
    losses: 0,
    matches: [
      {
        matchId: 'm',
        startedAt: '',
        mapName: 'Split',
        won: true,
        roundsWon: 13,
        roundsLost: 5,
        lengthMs: null,
        openingWon: 0,
        openingLost: 0,
        lineup: lineups.map(([name, agent, acs, kills, deaths]) => ({
          name,
          agent,
          acs,
          kills,
          deaths,
        })),
      },
    ],
  };
}

describe('debrief utils', () => {
  it('colours a session tile against the month', () => {
    const session = Array.from({ length: 10 }, (_, i) => round(i + 1, i < 7));
    const month = Array.from({ length: 10 }, (_, i) => round(i + 1, i < 5));
    const tile = debriefTiles(session, month, 'Septembre')[0];
    expect(tile).toMatchObject({ value: `70${UNIT_SPACE}%`, tone: 'good' });
    expect(tile.lines[0]).toBe(`Septembre : 50${UNIT_SPACE}%`);
  });

  it('ranks players by ACS with their gap to the month', () => {
    const forms = playerForms(
      [
        evening([
          ['A', 'Jett', 200, 10, 10],
          ['B', 'Sova', 250, 20, 10],
        ]),
      ],
      [evening([['A', 'Jett', 180, 10, 10]])],
    );
    expect(forms.map((f) => f.name)).toEqual(['B', 'A']);
    expect(forms[1].acsGap).toBe(20);
    expect(forms[0].acsGap).toBeNull();
  });

  it('lists the lost rounds the squad had in hand', () => {
    const rounds = [
      round(1, false, { bestProbability: 0.8, thrown: true }),
      round(2, false, { bestProbability: 0.3 }),
      round(3, false, { bestProbability: 0.6 }),
    ];
    expect(turningRounds(rounds).map((r) => r.chance)).toEqual([
      'Throw à 80 %',
      'Avait 60 % de chances',
    ]);
  });
});
