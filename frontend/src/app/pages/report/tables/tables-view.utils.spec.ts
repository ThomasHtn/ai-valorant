import { StatRow } from '@core/report/stat-table.model';

import { scopeFilter } from './tables-view.utils';

const row = (label: string, sub?: string): StatRow => ({ key: label, label, sub, cells: {} });
const maps = ['Ascent', 'Split'];
const players = ['Psilonnix'];

describe('tables view utils', () => {
  it('filters rows naming maps and sides', () => {
    const rows = [
      row('Split · attaque', 'Attaque'),
      row('Split · défense', 'Défense'),
      row('Ascent · attaque'),
    ];
    const keep = scopeFilter(rows, { map: 'Split', side: 'att', player: '' }, maps, players);
    expect(rows.filter((r) => keep?.(r)).map((r) => r.label)).toEqual(['Split · attaque']);
  });

  it('leaves tables without such rows whole', () => {
    const rows = [row('Pistol'), row('Eco')];
    expect(
      scopeFilter(rows, { map: 'Split', side: '', player: 'Psilonnix' }, maps, players),
    ).toBeNull();
  });
});
