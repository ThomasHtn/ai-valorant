import { describe, expect, it } from 'vitest';

import { matchCrumbs, roundNeighbours } from './match-round.utils';

describe('match round utils', () => {
  it('stops at the first and last round of the match', () => {
    expect(roundNeighbours(1, 16)).toEqual({ previous: null, next: 2 });
    expect(roundNeighbours(16, 16)).toEqual({ previous: 15, next: null });
  });

  it('leads back to the match list only, the match being the current step', () => {
    expect(matchCrumbs(null)).toEqual([{ label: 'Matchs', link: ['/report/matches'] }]);
  });
});
