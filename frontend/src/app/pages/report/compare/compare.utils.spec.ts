import { describe, expect, it } from 'vitest';

import { DomainTables, StatColumn } from '@core/report/stat-table.model';

import { cohortValue, compareGap, playerGroups, playerRow, teamGroups } from './compare.utils';

const rate: StatColumn = {
  key: 'rw',
  label: 'Rounds gagnés',
  format: 'pct',
  better: 1,
  min: 20,
  ref: 'top',
};
const count: StatColumn = {
  key: 'm',
  label: 'Matchs',
  format: 'int',
  better: 0,
  min: 0,
  ref: 'none',
};

const domain: DomainTables = {
  key: 'results',
  label: 'Résultats',
  tables: [
    {
      id: 'maps',
      title: 'Résultats par carte',
      rowsLabel: 'Carte',
      columns: [count, rate],
      rows: [
        {
          key: 'Split',
          label: 'Split',
          cells: { m: { v: 5 }, rw: { v: 0.4, n: 110, hist: 0.5, histN: 300 } },
        },
        {
          key: 'Lotus',
          label: 'Lotus',
          cells: { m: { v: 4 }, rw: { v: 0.45, n: 89, hist: null } },
        },
      ],
    },
    {
      id: 'players',
      title: 'Combat par joueur',
      rowsLabel: 'Joueur',
      columns: [rate],
      rows: [
        { key: 'a', label: 'Psilonnix', cells: { rw: { v: 0.6, n: 500 } } },
        { key: 'b', label: 'Izakiel · Sova', cells: { rw: { v: 0.4, n: 500 } } },
      ],
    },
  ],
};

describe('cohortValue', () => {
  it('reads the squad value or a reference with its sample', () => {
    const cell = domain.tables[0].rows[0].cells['rw'];
    expect(cohortValue(cell, 'squad')).toEqual({ value: 0.4, sample: 110 });
    expect(cohortValue(cell, 'hist')).toEqual({ value: 0.5, sample: 300 });
    expect(cohortValue(undefined, 'top')).toEqual({ value: null, sample: null });
  });
});

describe('compareGap', () => {
  it('colours a significant rate gap the way the column reads', () => {
    const gap = compareGap({ value: 0.6, sample: 500 }, { value: 0.4, sample: 500 }, rate);
    expect(gap.tone).toBe('good');
    expect(gap.text).toBe('+20 pts');
  });

  it('keeps a gap grey on small samples, for means and without values', () => {
    expect(compareGap({ value: 0.6, sample: 10 }, { value: 0.4, sample: 10 }, rate).tone).toBe(
      'ns',
    );
    expect(
      compareGap(
        { value: 250, sample: 500 },
        { value: 200, sample: 500 },
        { ...rate, format: 'dec1' },
      ).tone,
    ).toBe('ns');
    expect(compareGap({ value: null, sample: null }, { value: 0.4, sample: 10 }, rate).text).toBe(
      '—',
    );
  });
});

describe('teamGroups', () => {
  it('compares comparable columns only, skipping lines without any value', () => {
    const groups = teamGroups(domain, 'squad', 'hist', () => null);
    expect(groups[0].lines.map((l) => l.key)).toEqual(['Split:rw', 'Lotus:rw']);
    expect(groups[0].lines[1].b.value).toBeNull();
  });

  it('applies the scope filter of each table', () => {
    const groups = teamGroups(domain, 'squad', 'hist', (id) =>
      id === 'maps' ? (r) => r.label === 'Lotus' : null,
    );
    expect(groups[0].lines.map((l) => l.rowLabel)).toEqual(['Lotus']);
  });
});

describe('player mode', () => {
  it('finds a player row by name or by "name · agent"', () => {
    expect(playerRow(domain.tables[1].rows, 'Izakiel')?.key).toBe('b');
    expect(playerRow(domain.tables[1].rows, 'Izak')).toBeNull();
  });

  it('compares the two rows of each table holding both players', () => {
    const groups = playerGroups(domain, 'Psilonnix', 'Izakiel');
    expect(groups.map((g) => g.id)).toEqual(['players']);
    expect(groups[0].lines[0].gap.tone).toBe('good');
  });
});
