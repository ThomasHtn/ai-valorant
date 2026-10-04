import { describe, expect, it } from 'vitest';

import { DeathZone, HeadlineStat } from '@core/report/players.model';

import {
  clutchFigures,
  clutchSample,
  economyFormat,
  headlineFigure,
  isZoneTooDeadly,
  roleLabel,
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

describe('roleLabel', () => {
  it('translates the role, keeps an unknown one', () => {
    expect(roleLabel('Duelist')).toBe('Duelliste');
    expect(roleLabel('Coach')).toBe('Coach');
  });
});

describe('player figures', () => {
  it('reads a headline figure and writes economy means in credits', () => {
    const figure = headlineFigure(acs);
    expect(figure).toMatchObject({ key: 'acs', unit: 'rounds', help: 'acs' });
    expect(economyFormat(figure)).toBe('cr');
    expect(economyFormat({ ...figure, format: 'pct' })).toBe('pct');
  });

  it('names each clutch size and writes its record in words', () => {
    const line = { situation: '1v1', won: 2, played: 5, cell: { v: 0.4, n: 5 } };
    expect(clutchFigures([line])[0].label).toBe('Clutchs 1v1 gagnés');
    expect(clutchSample(line)).toBe('2 gagnés sur 5');
    expect(clutchSample({ ...line, won: 1 })).toBe('1 gagné sur 5');
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
    expect(zoneRateLine(zone)).toBe('16 morts pour 100 rounds sur Summit, top ranked 11');
    expect(zoneRateLine({ ...zone, topPer100Rounds: null })).toBe(
      '16 morts pour 100 rounds sur Summit',
    );
  });

  it('flags a zone only when clearly above top ranked with enough deaths', () => {
    expect(isZoneTooDeadly(zone)).toBe(true);
    expect(isZoneTooDeadly({ ...zone, topPer100Rounds: 14 })).toBe(false);
    expect(isZoneTooDeadly({ ...zone, deaths: 3 })).toBe(false);
  });
});
