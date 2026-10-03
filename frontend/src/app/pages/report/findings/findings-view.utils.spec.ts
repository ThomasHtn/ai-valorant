import { describe, expect, it } from 'vitest';

import { Finding } from '@core/report/findings.model';

import { barWidth, filterFindings, findingColumn } from './findings-view.utils';

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

const NO_FILTERS = { map: '', side: '', player: '' } as const;
const GLOBAL = { scope: 'Global', mapName: null, scopeSide: null } as const;

describe('filterFindings', () => {
  it('drops findings of another map but keeps those naming no map', () => {
    const list = [finding({}), finding({ scope: 'Lotus', mapName: 'Lotus' }), finding(GLOBAL)];
    const kept = filterFindings(list, { ...NO_FILTERS, map: 'Split' }, false);
    expect(kept.map((f) => f.scope)).toEqual(['Split · défense', 'Global']);
  });

  it('applies the player filter to player findings only', () => {
    const list = [
      finding({ group: 'players', scope: 'Psilonnix', player: 'Psilonnix', mapName: null }),
      finding({ group: 'players', scope: 'Izakiel', player: 'Izakiel', mapName: null }),
      finding({}),
    ];
    const kept = filterFindings(list, { ...NO_FILTERS, player: 'Izakiel' }, false);
    expect(kept.map((f) => f.scope)).toEqual(['Izakiel', 'Split · défense']);
  });

  it('applies the side filter to findings naming a side and keeps net gaps on demand', () => {
    const list = [
      finding({}),
      finding({ scope: 'Split · attaque', scopeSide: 'att', status: 'confirmed' }),
      finding({ scope: 'Split', scopeSide: null }),
    ];
    expect(filterFindings(list, { ...NO_FILTERS, side: 'att' }, false).length).toBe(2);
    expect(filterFindings(list, NO_FILTERS, true).length).toBe(1);
  });
});

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
