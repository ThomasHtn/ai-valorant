import { describe, expect, it } from 'vitest';

import { rewatchLinks } from './rewatch-links.utils';

describe('rewatchLinks', () => {
  const round = { matchId: 'm-1', day: '2026-09-30', mapName: 'Split', roundNumber: 14 };

  it('opens the round sheet of a round', () => {
    expect(rewatchLinks([round], 6)).toEqual([
      { key: 'm-1_14', label: '30/09 Split R14', commands: ['/report/rounds', 'm-1_14'] },
    ]);
  });

  it('opens the match when no round is given, and keeps at most max links', () => {
    const match = { ...round, matchId: 'm-2', roundNumber: null };
    const links = rewatchLinks([match, round, round], 2);
    expect(links.length).toBe(2);
    expect(links[0]).toEqual({
      key: 'm-2',
      label: '30/09 Split',
      commands: ['/report/matches', 'm-2'],
    });
  });
});
