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
  it('writes the halves start side first', () => {
    const digest = matchDigest(MATCH, rounds('WWWWWLLLLLLL' + 'LWLLLLLLL'));
    expect(digest.figures).toEqual([
      { label: 'Attaque', value: '5-7', tone: 'bad' },
      { label: 'Défense', value: '1-8', tone: 'bad' },
    ]);
  });

  it('keeps one fact, a lead thrown away before the loss streak', () => {
    const lost = { ...MATCH, roundsWon: 5, roundsLost: 13 };
    const facts = matchDigest(lost, rounds('WWWWWLLLLLLLLLLLLL')).facts;
    expect(facts.map((f) => f.text)).toEqual(['Menait 5-0, perd 5-13']);
  });

  it('leads a won match with its comeback', () => {
    const won = { ...MATCH, won: true, roundsWon: 13, roundsLost: 4 };
    const facts = matchDigest(won, rounds('LLLLWWWWWWWWWWWWW')).facts;
    expect(facts).toEqual([{ key: 'swing', tone: 'good', text: 'Mené 0-4, gagne 13-4' }]);
  });

  it('says nothing without rounds', () => {
    expect(matchDigest(MATCH, [])).toEqual({ figures: [], facts: [] });
  });
});
