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
    reference: 'top',
    squad: rate,
    opp: rate,
    top: rate,
    leverage: 1,
    gapRounds: -3,
    pValue: 0.01,
    status: 'lead',
    rewatch: [],
    ...overrides,
  };
}

const NO_FILTERS = { map: '', side: '', player: '' } as const;
const MAPS = ['Split', 'Lotus'];

describe('filterFindings', () => {
  it('drops findings of another map but keeps those naming no map', () => {
    const list = [finding({}), finding({ scope: 'Lotus' }), finding({ scope: 'Global' })];
    const kept = filterFindings(list, { ...NO_FILTERS, map: 'Split' }, MAPS, false);
    expect(kept.map((f) => f.scope)).toEqual(['Split · défense', 'Global']);
  });

  it('applies the player filter to player findings only', () => {
    const list = [
      finding({ group: 'players', scope: 'Psilonnix' }),
      finding({ group: 'players', scope: 'Izakiel' }),
      finding({}),
    ];
    const kept = filterFindings(list, { ...NO_FILTERS, player: 'Izakiel' }, MAPS, false);
    expect(kept.map((f) => f.scope)).toEqual(['Izakiel', 'Split · défense']);
  });

  it('applies the side filter to findings naming a side and keeps net gaps on demand', () => {
    const list = [
      finding({}),
      finding({ scope: 'Split · attaque', status: 'confirmed' }),
      finding({ scope: 'Split' }),
    ];
    expect(filterFindings(list, { ...NO_FILTERS, side: 'att' }, MAPS, false).length).toBe(2);
    expect(filterFindings(list, NO_FILTERS, MAPS, true).length).toBe(1);
  });
});

describe('findingColumn', () => {
  it('groups by team then players, the biggest gap first', () => {
    const list = [
      finding({ group: 'players', gapRounds: -1 }),
      finding({ gapRounds: -2 }),
      finding({ gapRounds: -8 }),
      finding({ side: 'strong', gapRounds: 4 }),
    ];
    const column = findingColumn(list, 'weak');
    expect(column.count).toBe(3);
    expect(column.groups.map((g) => g.label)).toEqual(['Équipe', 'Joueurs']);
    expect(column.groups[0].findings.map((f) => f.gapRounds)).toEqual([-8, -2]);
  });
});

describe('barWidth', () => {
  it('stays between 1 and 100', () => {
    expect(barWidth(null)).toBe(1);
    expect(barWidth(0.42)).toBe(42);
    expect(barWidth(1.3)).toBe(100);
  });
});
