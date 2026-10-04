import { describe, expect, it } from 'vitest';

import { rewatchGroups } from './rewatch-links.utils';

describe('rewatchGroups', () => {
  const round = { matchId: 'm-1', day: '2026-09-30', mapName: 'Split', roundNumber: 14 };

  it('opens the match from its label and the round sheet from its chip', () => {
    expect(rewatchGroups([round], 6)).toEqual([
      {
        key: 'm-1',
        label: '30/09 Split',
        commands: ['/report/matches', 'm-1'],
        rounds: [
          { key: 'm-1_14', label: 'R14', commands: ['/report/matches', 'm-1', 'rounds', '14'] },
        ],
      },
    ]);
  });

  it('groups rounds of one match, sorted, and keeps matches in order of appearance', () => {
    const other = { ...round, matchId: 'm-2', day: '2026-09-28', mapName: 'Lotus', roundNumber: 5 };
    const groups = rewatchGroups(
      [round, other, { ...round, roundNumber: 3 }, { ...round, roundNumber: 14 }],
      6,
    );
    expect(groups.map((g) => g.label)).toEqual(['30/09 Split', '28/09 Lotus']);
    expect(groups[0].rounds.map((r) => r.label)).toEqual(['R3', 'R14']);
  });

  it('keeps a whole match without chips and cuts at max rounds', () => {
    const match = { ...round, matchId: 'm-2', roundNumber: null };
    const groups = rewatchGroups([match, round, { ...round, roundNumber: 2 }], 2);
    expect(groups.map((g) => g.rounds.length)).toEqual([0, 1]);
  });
});
