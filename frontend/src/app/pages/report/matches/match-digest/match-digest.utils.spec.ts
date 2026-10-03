import { MatchSummary } from '@core/report/matches.model';

import { DigestRound } from './match-digest.model';
import { matchDigest } from './match-digest.utils';

const MATCH: MatchSummary = {
  matchId: 'm1',
  startedAt: '2026-09-30T21:14:00+02:00',
  mapName: 'Split',
  won: false,
  roundsWon: 0,
  roundsLost: 0,
  lengthMs: null,
  openingWon: 6,
  openingLost: 9,
  lineup: [],
};

/** Rounds from a 'W'/'L' string, attack first, pistol on rounds 1 and 13. */
function rounds(results: string, extra: Partial<DigestRound> = {}): DigestRound[] {
  return [...results].map((r, i) => ({
    roundNumber: i + 1,
    side: i < 12 ? 'att' : 'def',
    won: r === 'W',
    buy: i === 0 || i === 12 ? 'pistol' : 'full',
    oppBuy: 'full',
    cause: r === 'W' ? null : 'opening_lost',
    thrown: false,
    ...extra,
  }));
}

describe('matchDigest', () => {
  it('writes halves start side first, pistols and opening duels', () => {
    const digest = matchDigest(MATCH, rounds('WWWWWLLLLLLL' + 'LWLLLLLLL'));
    expect(digest.figures).toEqual([
      { label: 'Attaque', value: '5-7', tone: 'bad' },
      { label: 'Défense', value: '1-8', tone: 'bad' },
      { label: 'Pistols', value: '1 sur 2', tone: null },
      { label: 'Premiers duels', value: '6-9', tone: 'bad' },
    ]);
  });

  it('tells a lead thrown away first, then the loss streak and the main cause', () => {
    const lost = { ...MATCH, roundsWon: 5, roundsLost: 13 };
    const facts = matchDigest(lost, rounds('WWWWWLLLLLLLLLLLLL')).facts;
    expect(facts.map((f) => f.text)).toEqual([
      'Menait 5-0, perd 5-13',
      "13 rounds perdus d'affilée (R6 à R18)",
      'Cause n°1 des rounds perdus : ouverture perdue (13 sur 13)',
    ]);
  });

  it('leads a won match with its comeback and win streak', () => {
    const won = { ...MATCH, won: true, roundsWon: 13, roundsLost: 4 };
    const facts = matchDigest(won, rounds('LLLLWWWWWWWWWWWWW')).facts;
    expect(facts[0]).toEqual({ key: 'swing', tone: 'good', text: 'Mené 0-4, gagne 13-4' });
    expect(facts[1].key).toBe('win-streak');
  });

  it('says nothing beyond the opening duels without rounds', () => {
    expect(matchDigest(MATCH, [])).toEqual({
      figures: [{ label: 'Premiers duels', value: '6-9', tone: 'bad' }],
      facts: [],
    });
  });
});
