import { describe, expect, it } from 'vitest';

import { parseRoundParam, roundParam, sameRound } from './round-ref.utils';

describe('round address', () => {
  it('round-trips a match id with dashes', () => {
    const ref = { matchId: 'f1c919dd-118e-42c6', roundNumber: 18 };
    expect(parseRoundParam(roundParam(ref))).toEqual(ref);
  });

  it('rejects malformed parameters', () => {
    expect(parseRoundParam(undefined)).toBeNull();
    expect(parseRoundParam('abc')).toBeNull();
    expect(parseRoundParam('abc_0')).toBeNull();
    expect(parseRoundParam('_4')).toBeNull();
  });

  it('compares rounds', () => {
    expect(sameRound({ matchId: 'a', roundNumber: 1 }, { matchId: 'a', roundNumber: 1 })).toBe(
      true,
    );
    expect(sameRound({ matchId: 'a', roundNumber: 1 }, null)).toBe(false);
  });
});
