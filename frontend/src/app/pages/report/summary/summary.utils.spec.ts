import { describe, expect, it } from 'vitest';

import { Finding } from '@core/report/findings.model';
import { StatColumn, StatTable } from '@core/report/stat-table.model';

import { headlineTiles, pickColumns, priorityItems, relabelColumns } from './summary.utils';

const column = (key: string, label: string): StatColumn => ({
  key,
  label,
  format: 'pct',
  better: 1,
  min: 0,
  ref: 'top',
});

const rate = (count: number, total: number) => ({ count, total, value: count / total });

function finding(overrides: Partial<Finding>): Finding {
  return {
    side: 'weak',
    group: 'team',
    scope: 'Split',
    metric: 'Rounds gagnés',
    kind: 'rw',
    art: null,
    mapName: 'Split',
    scopeSide: null,
    player: null,
    reference: 'top',
    squad: rate(40, 100),
    opp: rate(60, 100),
    top: rate(50, 100),
    leverage: 1,
    gapRounds: -2,
    pValue: 0.2,
    status: 'lead',
    matches: 4,
    lostCauses: {},
    rewatch: [],
    ...overrides,
  };
}

describe('pickColumns', () => {
  it('keeps the asked columns in the asked order and skips unknown ones', () => {
    const table: StatTable = {
      id: 't',
      title: 'T',
      rowsLabel: 'Carte',
      columns: [column('a', 'A'), column('b', 'B'), column('c', 'C')],
      rows: [],
    };
    expect(pickColumns(table, ['c', 'x', 'a']).columns.map((c) => c.key)).toEqual(['c', 'a']);
  });
});

describe('relabelColumns', () => {
  it('renames the given columns only', () => {
    const table: StatTable = {
      id: 't',
      title: 'T',
      rowsLabel: 'Carte',
      columns: [column('a', 'A'), column('b', 'B')],
      rows: [],
    };
    expect(relabelColumns(table, { b: 'Bé' }).columns.map((c) => c.label)).toEqual(['A', 'Bé']);
  });
});

describe('headlineTiles', () => {
  it('reads the total row of the maps table, then full buy against full buy', () => {
    const maps: StatTable = {
      id: 'results-maps',
      title: 'Résultats par carte',
      rowsLabel: 'Carte',
      columns: [column('rw', 'Rounds gagnés'), column('att', 'Attaque')],
      rows: [
        { key: 'split', label: 'Split', cells: { rw: { v: 0.4 } } },
        {
          key: 'all',
          label: 'Toutes les cartes',
          total: true,
          cells: { rw: { v: 0.48, top: 0.5 } },
        },
      ],
    };
    const roundTypes: StatTable = {
      id: 'results-round-types',
      title: 'Types',
      rowsLabel: 'Type',
      columns: [column('rw', 'Rounds gagnés')],
      rows: [{ key: 'ff', label: 'Full buy contre full buy', cells: { rw: { v: 0.55 } } }],
    };
    const tiles = headlineTiles(maps, roundTypes, 'top', 'Avant septembre');
    expect(tiles.map((t) => t.label)).toEqual(['Rounds gagnés', 'Full buy contre full buy']);
    expect(tiles[0].value).toBe('48 %');
  });
});

describe('priorityItems', () => {
  it('lists confirmed gaps before leads, a subject led by its biggest confirmed gap', () => {
    const items = priorityItems(
      [
        finding({ scope: 'Split', gapRounds: -11 }),
        finding({ scope: 'Lotus', mapName: 'Lotus', gapRounds: -9, status: 'confirmed' }),
        finding({ scope: 'Lotus', mapName: 'Lotus', metric: 'Retake gagné', gapRounds: -10 }),
      ],
      'weak',
      5,
    );
    expect(items.map((i) => [i.scope, i.gapRounds, i.confirmed])).toEqual([
      ['Lotus', -9, true],
      ['Split', -11, false],
    ]);
  });

  it('ranks subjects by rounds at stake and writes the gap against the tested reference', () => {
    const lotus = { scope: 'Lotus', mapName: 'Lotus', reference: 'opp' as const };
    const items = priorityItems(
      [
        finding({ gapRounds: -2 }),
        finding({
          ...lotus,
          gapRounds: -8.5,
          status: 'confirmed',
          lostCauses: { retake_failed: 3 },
        }),
        finding({ scope: 'Split · défense', scopeSide: 'def', gapRounds: -1.5 }),
        finding({ side: 'strong', gapRounds: 12 }),
      ],
      'weak',
      5,
    );
    expect(items.map((i) => i.scope)).toEqual(['Lotus', 'Split']);
    expect(items[0].gapRounds).toBe(-8.5);
    expect(items[0].matches).toBe(4);
    expect(items[0].detail).toBe('40 % contre 60 % chez les adversaires');
    expect(items[0].status).toBe('Écart net');
  });
});
