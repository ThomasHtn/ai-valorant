import { describe, expect, it } from 'vitest';

import { FormMatch, HeadlineStat } from '@core/report/players.model';

import {
  clutchBars,
  formTone,
  headlineTiles,
  referenceLine,
  roleLabel,
  sampleLine,
} from './players.utils';

const acs: HeadlineStat = {
  key: 'acs',
  label: 'ACS',
  format: 'int',
  better: 1,
  help: 'acs',
  min: 20,
  cell: { v: 281, n: 576, top: 224.6, topN: 147466, opp: 245, oppN: 1071, hist: 298, histN: 1531 },
};

const match = (value: number): FormMatch => ({
  matchId: 'm',
  day: '2026-09-30',
  mapName: 'Split',
  agent: 'Jett',
  acs: value,
  kills: 14,
  deaths: 17,
  assists: 6,
  won: false,
  score: '6-13',
  inPeriod: true,
});

describe('roleLabel', () => {
  it('translates the role, keeps an unknown one', () => {
    expect(roleLabel('Duelist')).toBe('Duelliste');
    expect(roleLabel('Coach')).toBe('Coach');
  });
});

describe('referenceLine and sampleLine', () => {
  it('writes the reference with its sample', () => {
    expect(referenceLine(acs.cell, 'top', 'int')).toBe('Top ranked 225 · 147 466');
  });

  it('says when a reference is missing', () => {
    expect(referenceLine({ v: 0.5, n: 10, hist: null }, 'hist', 'pct')).toBe(
      'Historique : pas de référence',
    );
  });

  it('writes the sample', () => {
    expect(sampleLine(acs.cell)).toBe('Sur 576');
    expect(sampleLine({ v: 1 })).toBeNull();
  });
});

describe('headlineTiles', () => {
  it('colours the tile against the chosen reference', () => {
    expect(headlineTiles([acs], 'top', true)[0].tone).toBe('good');
    expect(headlineTiles([acs], 'hist', true)[0].tone).toBe('bad');
  });

  it('leaves tiles uncoloured when colours are off', () => {
    expect(headlineTiles([acs], 'top', false)[0].tone).toBeNull();
  });
});

describe('formTone', () => {
  it('compares one match with the ACS reference, whatever the sample', () => {
    expect(formTone(match(320), acs, 'top', true)).toBe('good');
    expect(formTone(match(150), acs, 'top', true)).toBe('bad');
  });
});

describe('clutchBars', () => {
  it('places the bar and the reference tick in percent', () => {
    const [bar] = clutchBars(
      [{ situation: '1v1', won: 4, played: 8, cell: { v: 0.5, n: 8, top: 0.62 } }],
      'top',
      true,
    );
    expect(bar).toMatchObject({ width: 50, tick: 62, record: '4/8', tone: 'small' });
  });
});
