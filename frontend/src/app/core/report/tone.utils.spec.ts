import { StatColumn } from './stat-table.model';
import { cellTone, columnReference } from './tone.utils';

const rate: StatColumn = {
  key: 'rw',
  label: 'Rounds gagnés',
  format: 'pct',
  better: 1,
  min: 20,
  ref: 'top',
};
const mean: StatColumn = {
  key: 'acs',
  label: 'ACS',
  format: 'dec1',
  better: 1,
  min: 0,
  ref: 'top',
};

describe('tone utils', () => {
  it('colours a rate within 3 points of the reference orange, beyond it green or red', () => {
    expect(cellTone({ v: 0.5, n: 100, top: 0.48 }, rate, 'top')).toBe('avg');
    expect(cellTone({ v: 0.55, n: 100, top: 0.48 }, rate, 'top')).toBe('good');
    expect(cellTone({ v: 0.4, n: 100, top: 0.48 }, rate, 'top')).toBe('bad');
  });

  it('colours a mean within 5 % of the reference orange', () => {
    expect(cellTone({ v: 196, top: 200 }, mean, 'top')).toBe('avg');
    expect(cellTone({ v: 230, top: 200 }, mean, 'top')).toBe('good');
  });

  it('follows the direction of the column', () => {
    const deaths: StatColumn = { ...rate, better: -1 };
    expect(cellTone({ v: 0.4, n: 100, top: 0.48 }, deaths, 'top')).toBe('good');
  });

  it('greys a cell under the minimum sample', () => {
    expect(cellTone({ v: 0.2, n: 6, top: 0.5 }, rate, 'top')).toBe('small');
  });

  it('uses the chosen reference, or the forced history', () => {
    const cell = { v: 0.5, n: 100, top: 0.5, opp: 0.6, hist: 0.4 };
    expect(cellTone(cell, rate, 'opp')).toBe('bad');
    expect(cellTone(cell, { ...rate, ref: 'hist' }, 'opp')).toBe('good');
    expect(columnReference({ ...rate, ref: 'none' }, 'top')).toBeNull();
  });

  it('leaves text, neutral columns and missing references uncoloured', () => {
    expect(cellTone({ v: '12-15' }, rate, 'top')).toBeNull();
    expect(cellTone({ v: 0.5, n: 100, top: 0.4 }, { ...rate, better: 0 }, 'top')).toBeNull();
    expect(cellTone({ v: 0.5, n: 100, top: null }, rate, 'top')).toBeNull();
  });
});
