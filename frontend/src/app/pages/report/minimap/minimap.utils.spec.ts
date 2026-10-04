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
  plantSpots,
  zoneLines,
  zoneMatchCount,
  zonePlayers,
  zoneRows,
  zoneSummary,
  zoneTone,
  zoneVerdict,
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
  topPlants: [
    { x: 0.3, y: 0.8, count: 400 },
    { x: 0.6, y: 0.2, count: 100 },
  ],
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
    expect(markers[0].link).toEqual(['/report/matches', 'm', 'rounds', '3']);
    expect(markers[0].tip?.lines).toContainEqual({ label: 'Tué par', value: 'Opp' });
  });

  it('sums the top ranked plants and draws them only when their layer is on', () => {
    expect(layerCounts(side, view.topPlants).plantsTop).toBe(500);
    expect(plantSpots(view.topPlants, new Set(['firstDeaths']))).toEqual([]);
    const spots = plantSpots(view.topPlants, new Set(['plantsTop']));
    expect(spots.map((s) => s.weight)).toEqual([1, 0.5]);
    expect(spots[1].tip?.lines?.[0].value).toBe('100 sur 500');
    expect(minimapMarkers(view, 'att', new Set(['plantsTop']), '')).toEqual([]);
  });

  it('draws nothing on a side without data', () => {
    expect(minimapMarkers(view, 'def', new Set(['firstDeaths']), '')).toEqual([]);
  });

  it('picks the map from the URL, then the usual map', () => {
    const maps = ['Ascent', 'Lotus', 'Split'];
    expect(pickMap('lotus', maps)).toBe('Lotus');
    expect(pickMap(undefined, maps)).toBe('Split');
    expect(pickMap(undefined, ['Haven'])).toBe('Haven');
    expect(pickMap(undefined, [])).toBeNull();
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

  it('writes the figures in words and scales the bars on the largest share', () => {
    const lines = zoneLines(
      [row('B Garage', 5, 15, 0.18, 0.07), row('A Main', 2, 4, 0.09, 0.12)],
      28,
    );
    expect(lines[0]).toMatchObject({
      count: '5 sur 28 first deaths',
      top: `Top ranked ${formatValue(0.07, 'pct')}`,
      bar: 100,
      tone: 'over',
    });
    expect(lines[1].bar).toBe(50);
    expect(lines[1].tick).toBeCloseTo(66.7, 1);
  });

  it('sums up the other events of a zone', () => {
    const zone = { ...row('A', 1, 15), kills: 1, revengeRate: 0.2 };
    expect(zoneSummary(zone)).toBe(
      `15 morts et 1 kill ici, 20${UNIT_SPACE}% des morts avec revenge.`,
    );
  });

  it('lists each player with their rounds grouped by match, newest match first', () => {
    const ref = (
      matchId: string,
      day: string,
      roundNumber: number,
      player: string,
      firstDeath = false,
    ) => ({
      matchId,
      day,
      roundNumber,
      player,
      firstDeath,
    });
    const zone: ZoneRow = {
      ...row('Mid Top', 1, 4),
      players: [
        { name: 'Izakiel', deaths: 3 },
        { name: 'kikoucraft', deaths: 1 },
      ],
      refs: [
        ref('m-2', '2026-10-01', 1, 'kikoucraft', true),
        ref('m-1', '2026-09-30', 6, 'Izakiel'),
        ref('m-2', '2026-10-01', 10, 'Izakiel'),
        ref('m-2', '2026-10-01', 3, 'Izakiel'),
      ],
    };
    const [izakiel, kikoucraft] = zonePlayers(zone);
    expect(izakiel.groups.map((g) => g.label)).toEqual(['01/10', '30/09']);
    expect(izakiel.groups[0].rounds.map((r) => r.label)).toEqual(['R3', 'R10']);
    expect(izakiel.more).toBe(0);
    expect(kikoucraft.groups[0].rounds[0]).toMatchObject({
      firstDeath: true,
      commands: ['/report/matches', 'm-2', 'rounds', '1'],
    });
    expect(zoneMatchCount([zone])).toBe(2);
  });

  it('counts the deaths beyond the linked rounds', () => {
    const zone: ZoneRow = { ...row('A', 0, 9), players: [{ name: 'Izakiel', deaths: 9 }] };
    expect(zonePlayers(zone)[0].more).toBe(9);
  });

  it('lists only zones where the squad or the top ranked die first', () => {
    expect(zoneLines([row('A', 0, 2, 0, 0)], 20)).toEqual([]);
    expect(zoneLines([row('A', 0, 2, 0, 0.1)], 20)).toHaveLength(1);
  });

  it('names the zones to work on only once the side has enough first deaths', () => {
    const over = row('B Alley', 6, 8, 0.3, 0.1);
    expect(zoneLines([over], 6)[0].tone).toBe('even');
    expect(zoneVerdict(zoneLines([over], 6), 6).text).toMatch(/^seulement 6 first deaths/);
    const lines = zoneLines([over, row('Mid', 5, 5, 0.25, 0.1)], 20);
    expect(zoneVerdict(lines, 20)).toEqual({
      text: "l'escouade meurt en premier plus souvent que le top ranked à B Alley et Mid.",
      alert: true,
    });
  });
});
