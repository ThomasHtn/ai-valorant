import { describe, expect, it } from 'vitest';

import { Finding } from '@core/report/findings.model';
import { StatColumn, StatTable } from '@core/report/stat-table.model';

import { headlineTiles, pickColumns, priorityItems } from './summary.utils';

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
    const tiles = headlineTiles(maps, roundTypes, 'top', true);
    expect(tiles.map((t) => t.label)).toEqual(['Rounds gagnés', 'Full buy contre full buy']);
    expect(tiles[0].value).toBe('48 %');
  });
});

describe('priorityItems', () => {
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
    expect(items[0].gap).toBe('−8,5');
    expect(items[0].unit).toBe('rounds sur 4 matchs');
    expect(items[0].detail).toBe('40 % contre 60 % (adversaires)');
    expect(items[0].status).toBe('Écart net');
  });
});
