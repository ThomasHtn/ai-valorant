import { describe, expect, it } from 'vitest';

import { REFERENCE_SHORT_LABELS } from '@core/format/labels.constants';
import { UNIT_SPACE } from '@core/format/value-format.utils';
import { DeathZone, FormMatch, HeadlineStat, OpeningDuels } from '@core/report/players.model';

import {
  clutchBars,
  formTone,
  headlineColumn,
  headlineTiles,
  isZoneTooDeadly,
  profileRows,
  referenceLine,
  roleLabel,
  sampleLine,
  zoneRateLine,
} from './players.utils';

const acs: HeadlineStat = {
  key: 'acs',
  label: 'ACS',
  format: 'int',
  better: 1,
  help: 'acs',
  unit: 'rounds',
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
  it('writes the reference value without its sample', () => {
    expect(referenceLine(acs.cell, headlineColumn(acs), 'top')).toBe('Top ranked 225');
  });

  it('names the reference the column forces, whatever the chosen one', () => {
    const rounds = { ...headlineColumn(acs), format: 'pct' as const, ref: 'hist' as const };
    expect(referenceLine({ v: 0.48, hist: 0.5 }, rounds, 'top')).toMatch(/^Historique 50\s%$/u);
  });

  it('says when a reference is missing', () => {
    const rate = { ...headlineColumn(acs), format: 'pct' as const };
    expect(referenceLine({ v: 0.5, n: 10, hist: null }, rate, 'hist')).toBe(
      `${REFERENCE_SHORT_LABELS.hist} : pas de référence`,
    );
  });

  it('writes the sample', () => {
    expect(sampleLine(acs.cell, 'rounds')).toBe('Sur 576 rounds');
    expect(sampleLine({ v: 1 })).toBeNull();
  });
});

describe('headlineTiles', () => {
  it('writes one sample, the squad one, under the reference value', () => {
    expect(headlineTiles([acs], 'top', true)[0].lines).toEqual([
      'Top ranked 225',
      'Sur 576 rounds',
    ]);
  });

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

describe('death zone rate', () => {
  const zone: DeathZone = {
    mapName: 'Summit',
    zone: 'A Garden',
    deaths: 11,
    share: 0.1,
    firstDeaths: 2,
    firstDeathShare: 0.18,
    roundsPlayed: 68,
    per100Rounds: 16.2,
    topPer100Rounds: 11.4,
    rounds: [],
  };

  it('writes the rate beside top ranked', () => {
    expect(zoneRateLine(zone)).toBe('16,2 pour 100 rounds · top ranked 11,4');
    expect(zoneRateLine({ ...zone, topPer100Rounds: null })).toBe('16,2 pour 100 rounds');
  });

  it('flags a zone only when clearly above top ranked with enough deaths', () => {
    expect(isZoneTooDeadly(zone)).toBe(true);
    expect(isZoneTooDeadly({ ...zone, topPer100Rounds: 14 })).toBe(false);
    expect(isZoneTooDeadly({ ...zone, deaths: 3 })).toBe(false);
  });
});

describe('profileRows', () => {
  const duels: OpeningDuels = {
    firstBloods: 12,
    firstDeaths: 31,
    duelsWon: { v: 0.28, n: 43, opp: 0.38, oppN: 91 },
    wonAfterFirstBlood: { v: null },
    wonAfterFirstDeath: { v: null },
  };

  it('lists the headline figures then the duels won, each once with reference and sample', () => {
    const rows = profileRows([acs], duels, 'opp', true);
    expect(rows.map((r) => r.key)).toEqual(['acs', 'duelsWon']);
    expect(rows[0]).toMatchObject({ value: '281', reference: '245', tone: 'good', better: 1 });
    expect(rows[0].sample).toContain('576');
    expect(rows[1]).toMatchObject({
      value: `28${UNIT_SPACE}%`,
      reference: `38${UNIT_SPACE}%`,
      tone: 'bad',
    });
  });

  it('does not add the duels twice when the role already has them', () => {
    const opening: HeadlineStat = { ...acs, key: 'openingWon', format: 'pct' };
    expect(profileRows([acs, opening], duels, 'opp', true).map((r) => r.key)).toEqual([
      'acs',
      'openingWon',
    ]);
  });
});
