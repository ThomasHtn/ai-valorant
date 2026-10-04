import { describe, expect, it } from 'vitest';

import { parseRecord } from './win-loss.utils';

describe('parseRecord', () => {
  it('splits a record into wins and losses', () => {
    expect(parseRecord('12-15')).toEqual({ wins: 12, losses: 15 });
  });

  it('rejects anything else', () => {
    expect(parseRecord('Platinum 1')).toBeNull();
    expect(parseRecord(3)).toBeNull();
    expect(parseRecord(null)).toBeNull();
  });
});
