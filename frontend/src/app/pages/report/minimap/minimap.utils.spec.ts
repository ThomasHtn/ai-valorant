import { describe, expect, it } from 'vitest';

import { UNIT_SPACE, formatValue } from '@core/format/value-format.utils';
import {
  MapPoint,
  MinimapSide,
  MinimapView,
  PlantPoint,
  ZoneRow,
} from '@core/report/minimap.model';

import {
  layerCounts,
  minimapMarkers,
  pickMap,
  sideLayers,
  zoneLines,
  zoneRows,
  zoneTone,
} from './minimap.utils';

function point(player: string, x = 0.5): MapPoint {
  return {
    x,
    y: 0.5,
    player,
    other: 'Opp',
    weapon: 'Vandal',
    zone: 'A Main',
    avenged: false,
    matchId: 'm',
    roundNumber: 3,
    day: '2026-09-30',
  };
}

function plant(squadPlant: boolean): PlantPoint {
  return {
    x: 0.2,
    y: 0.2,
    site: 'A',
    planter: squadPlant ? 'Izakiel' : 'Opp',
    squadPlant,
    won: true,
    matchId: 'm',
    roundNumber: 4,
    day: '2026-09-30',
  };
}

const side: MinimapSide = {
  layers: {
    firstDeaths: [point('Psilonnix'), point('getjfox', 0.3)],
    firstBloods: [point('Izakiel')],
    deaths: [],
    kills: [],
    plants: [plant(true), plant(false), plant(false)],
    isolatedDeaths: [],
    enemyKillerSpots: [],
    rounds: 52,
  },
  zones: { firstDeaths: 2, topFirstDeaths: 100, rows: [] },
};
const view: MinimapView = {
  mapName: 'Split',
  minimapUrl: '',
  callouts: [],
  sides: { att: side },
  outOfMap: 0,
};

describe('minimap view utils', () => {
  it('splits plants by who planted', () => {
    const counts = layerCounts(side);
    expect(counts.plantsSquad).toBe(1);
    expect(counts.plantsEnemy).toBe(2);
    expect(counts.firstDeaths).toBe(2);
  });

  it('draws the active layers and dims the other players', () => {
    const markers = minimapMarkers(view, 'att', new Set(['firstDeaths']), 'Psilonnix');
    expect(markers.map((m) => m.dimmed)).toEqual([false, true]);
    expect(markers[0].link).toEqual(['/report/rounds', 'm_3']);
    expect(markers[0].tip?.lines).toContainEqual({ label: 'Tué par', value: 'Opp' });
  });

  it('draws nothing on a side without data', () => {
    expect(minimapMarkers(view, 'def', new Set(['firstDeaths']), '')).toEqual([]);
  });

  it('picks the map from the URL, the filter, then the usual map', () => {
    const maps = ['Ascent', 'Lotus', 'Split'];
    expect(pickMap('lotus', 'Ascent', maps)).toBe('Lotus');
    expect(pickMap(undefined, 'Ascent', maps)).toBe('Ascent');
    expect(pickMap(undefined, '', maps)).toBe('Split');
    expect(pickMap(undefined, '', ['Haven'])).toBe('Haven');
    expect(pickMap(undefined, '', [])).toBeNull();
  });

  it('hides the plants layer that is always empty on a side', () => {
    expect(sideLayers('att').map((l) => l.key)).not.toContain('plantsEnemy');
    expect(sideLayers('def').map((l) => l.key)).not.toContain('plantsSquad');
    expect(sideLayers('def').map((l) => l.key)).toContain('plantsEnemy');
  });

  const row = (
    zone: string,
    firstDeaths: number,
    deaths: number,
    share: number | null = null,
    top: number | null = null,
  ): ZoneRow => ({
    zone,
    firstDeaths,
    deaths,
    kills: 0,
    revengeRate: null,
    revengeSample: 0,
    players: [],
    firstDeathShare: share,
    topFirstDeathShare: top,
    refs: [],
  });

  it('sorts zones by excess over the top ranked, zones without reference last', () => {
    const sorted = zoneRows([
      row('A', 5, 9, 0.18, 0.23),
      row('B', 5, 1, 0.18, 0.11),
      row('C', 1, 12),
      row('D', 0, 0),
      row('E', 3, 4, 0.29, 0.14),
    ]);
    expect(sorted.map((r) => r.zone)).toEqual(['E', 'B', 'A', 'C']);
  });

  it('flags a zone only past the gap and on enough first deaths', () => {
    expect(zoneTone(row('A', 5, 5, 0.18, 0.11))).toBe('over');
    expect(zoneTone(row('A', 2, 5, 0.4, 0.1))).toBe('even');
    expect(zoneTone(row('A', 5, 5, 0.12, 0.11))).toBe('even');
    expect(zoneTone(row('A', 1, 5, 0.05, 0.2))).toBe('under');
    expect(zoneTone(row('A', 5, 5, null, 0.2))).toBe('even');
  });

  it('writes the gap in rate points', () => {
    const [line] = zoneLines([row('B Garage', 5, 15, 0.18, 0.07)]);
    expect(line.excess).toBe(`+11${UNIT_SPACE}pts`);
    expect(line.topShare).toBe(formatValue(0.07, 'pct'));
  });
});
