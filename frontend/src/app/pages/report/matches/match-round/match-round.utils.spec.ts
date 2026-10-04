import { describe, expect, it } from 'vitest';

import { roundNeighbours } from './match-round.utils';

describe('match round utils', () => {
  it('stops at the first and last round of the match', () => {
    expect(roundNeighbours(1, 16)).toEqual({ previous: null, next: 2 });
    expect(roundNeighbours(16, 16)).toEqual({ previous: 15, next: null });
  });
});
