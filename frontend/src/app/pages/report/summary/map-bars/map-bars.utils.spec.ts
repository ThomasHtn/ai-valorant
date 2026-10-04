import { StatTable } from '@core/report/stat-table.model';

import { halfWidth, mapBars } from './map-bars.utils';

const table: StatTable = {
  id: 'results-maps',
  title: 'Résultats par carte',
  rowsLabel: 'Carte',
  columns: [],
  rows: [
    {
      key: 'haven',
      label: 'Haven',
      cells: { wl: { v: '3-0' }, rw: { v: 0.62, hist: 0.5 }, diff: { v: 5 } },
    },
  ],
};

describe('mapBars', () => {
  it('places rounds won around 50 % with the record and the score gap', () => {
    const [haven] = mapBars(table, 'Avant septembre');
    expect(haven).toMatchObject({ wins: 3, losses: 0, points: 12, diffSign: 1 });
    expect(haven.diff).toContain('rounds par match');
    expect(haven.tip.lines?.[2].label).toBe('Avant septembre');
  });

  it('caps the half bar at the scale', () => {
    expect(halfWidth(10)).toBe(50);
    expect(halfWidth(-40)).toBe(100);
  });
});
