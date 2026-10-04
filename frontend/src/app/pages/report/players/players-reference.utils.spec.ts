import { describe, expect, it } from 'vitest';

import { playerReferenceNames } from './players-reference.utils';

describe('playerReferenceNames', () => {
  it('names players of his role, or his own past', () => {
    expect(playerReferenceNames('opp', 'Initiator', 'Avant septembre')).toEqual({
      sentence: 'les initiateurs des équipes affrontées',
      short: 'Initiateurs adverses',
    });
    expect(playerReferenceNames('top', 'Duelist', 'Avant septembre').short).toBe(
      'Duellistes du top ranked',
    );
    expect(playerReferenceNames('hist', 'Sentinel', 'Avant septembre')).toEqual({
      sentence: 'ses propres matchs avant septembre',
      short: 'Avant septembre',
    });
  });
});
