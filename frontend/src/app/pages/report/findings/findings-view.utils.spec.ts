import { describe, expect, it } from 'vitest';

import { Finding } from '@core/report/findings.model';

import { barWidth, findingColumn, openTarget } from './findings-view.utils';

const rate = { count: 1, total: 2, value: 0.5 };

function finding(overrides: Partial<Finding>): Finding {
  return {
    side: 'weak',
    group: 'team',
    scope: 'Split · défense',
    metric: 'Rounds gagnés',
    kind: 'rounds',
    art: null,
    mapName: 'Split',
    scopeSide: 'def',
    player: null,
    reference: 'top',
    squad: rate,
    opp: rate,
    top: rate,
    leverage: 1,
    gapRounds: -3,
    pValue: 0.01,
    status: 'lead',
    matches: 3,
    lostCauses: {},
    rewatch: [],
    ...overrides,
  };
}

describe('findingColumn', () => {
  it('groups by team then players, one entry per subject, the biggest gap first', () => {
    const list = [
      finding({ group: 'players', player: 'Alpha', mapName: null, gapRounds: -1 }),
      finding({ gapRounds: -2 }),
      finding({ scope: 'Lotus', mapName: 'Lotus', gapRounds: -3 }),
      finding({ gapRounds: -8 }),
      finding({ side: 'strong', gapRounds: 4 }),
    ];
    const column = findingColumn(list, 'weak');
    expect(column.count).toBe(3);
    expect(column.groups.map((g) => g.label)).toEqual(['Équipe', 'Joueurs']);
    const team = column.groups[0].subjects;
    expect(team.map((s) => s.lead.gapRounds)).toEqual([-8, -3]);
    expect(team[0].others.map((f) => f.gapRounds)).toEqual([-2]);
  });
});

describe('barWidth', () => {
  it('stays between 1 and 100', () => {
    expect(barWidth(null)).toBe(1);
    expect(barWidth(0.42)).toBe(42);
    expect(barWidth(1.3)).toBe(100);
  });
});

describe('openTarget', () => {
  it('splits the side from a subject key that holds colons', () => {
    expect(openTarget('weak:map:Split')).toEqual({ side: 'weak', key: 'map:Split' });
    expect(openTarget('other:x')).toEqual({ side: null, key: null });
    expect(openTarget(undefined)).toEqual({ side: null, key: null });
  });
});
