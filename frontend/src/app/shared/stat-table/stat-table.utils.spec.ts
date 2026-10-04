import { StatColumn, StatRow, StatTable } from '@core/report/stat-table.model';

import {
  buildRowViews,
  cellTipLines,
  isWideTable,
  nextSort,
  resolveRowArt,
  sortRows,
} from './stat-table.utils';

const column: StatColumn = {
  key: 'rw',
  label: 'Rounds gagnés',
  format: 'pct',
  better: 1,
  min: 20,
  ref: 'top',
};
const row = (label: string, v: number | null, total = false): StatRow => ({
  key: label,
  label,
  total,
  cells: { rw: { v, n: 100, top: 0.5, topN: 1000 } },
});
const table: StatTable = {
  id: 't',
  title: 'Résultats par carte',
  rowsLabel: 'Carte',
  columns: [column],
  rows: [row('Toutes', 0.48, true), row('Ascent', 0.49), row('Split', 0.4), row('Haven', null)],
};
const display = { reference: 'top' as const };

describe('stat table utils', () => {
  it('sorts on a column with missing values last and the total row at the bottom', () => {
    const sorted = sortRows(table.rows, { key: 'rw', direction: -1 });
    expect(sorted.map((r) => r.label)).toEqual(['Ascent', 'Split', 'Haven', 'Toutes']);
  });

  it('cycles the sort descending, ascending, then none', () => {
    expect(nextSort(null, 'rw')).toEqual({ key: 'rw', direction: -1 });
    expect(nextSort({ key: 'rw', direction: -1 }, 'rw')).toEqual({ key: 'rw', direction: 1 });
    expect(nextSort({ key: 'rw', direction: 1 }, 'rw')).toBeNull();
  });

  it('draws player rows with their avatar agent', () => {
    const agents = { Psilonnix: 'Jett' };
    expect(resolveRowArt({ key: 'p', label: 'Psilonnix · Omen', cells: {} }, agents)).toEqual({
      type: 'agent',
      slug: 'jett',
    });
    expect(
      resolveRowArt(
        { key: 'p', label: 'x', art: { type: 'player', slug: 'psilonnix' }, cells: {} },
        agents,
      ),
    ).toEqual({ type: 'agent', slug: 'jett' });
    expect(resolveRowArt({ key: 'm', label: 'Ascent', cells: {} }, agents)).toBeNull();
  });

  it('formats and colours cells, keeping the total row whatever the filter', () => {
    const views = buildRowViews(table, display, {}, (r) => r.label === 'Split', null);
    expect(views.map((v) => v.row.label)).toEqual(['Toutes', 'Split']);
    const split = views[1].cells[0];
    expect(split.text).toBe('40 %');
    expect(split.tone).toBe('bad');
  });

  it('lists the squad and every reference in a cell tip, marking the one used', () => {
    const lines = cellTipLines(
      { v: 0.4, n: 110, top: 0.5, topN: 1000, hist: 0.45, histN: 300 },
      column,
      'top',
    );
    expect(lines.map((l) => [l.label, l.isReference])).toEqual([
      ["L'escouade", false],
      ['Top ranked', true],
      ["L'escouade avant la période", false],
    ]);
  });
});

describe('isWideTable', () => {
  it('keeps tables of up to five columns narrow', () => {
    const columns = (n: number) => ({ columns: Array.from({ length: n }) as StatTable['columns'] });
    expect(isWideTable(columns(5))).toBe(false);
    expect(isWideTable(columns(6))).toBe(true);
  });
});
