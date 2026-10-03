import { Side } from '@core/common/enums.model';
import { dayMonth } from '@core/format/format.utils';
import { formatGap, formatValue, integer } from '@core/format/value-format.utils';
import {
  DensityCell,
  MapPoint,
  MinimapSide,
  MinimapView,
  PlantPoint,
  ZoneRow,
} from '@core/report/minimap.model';
import { roundLink } from '@core/report/round-ref.utils';
import { HoverTipContent, HoverTipLine } from '@shared/hover-tip/hover-tip.model';
import { MinimapDensitySpot, MinimapMarker } from '@shared/minimap-canvas/minimap-canvas.model';

import { HIDDEN_LAYERS, MINIMAP_LAYERS, PREFERRED_MAP } from './minimap-layers.constants';
import { MinimapLayer, MinimapLayerKey } from './minimap-layers.model';
import {
  MAX_ROUNDS_PER_PLAYER,
  VERDICT_ZONES,
  ZONE_EXCESS_ALERT,
  ZONE_MIN_FIRST_DEATHS,
  ZONE_MIN_SIDE_FIRST_DEATHS,
  ZONE_MIN_TOP_SHARE,
} from './zone-table/zone-table.constants';
import {
  ZoneLine,
  ZoneMatchGroup,
  ZonePlayerLine,
  ZoneTone,
  ZoneVerdict,
} from './zone-table/zone-table.model';

type LayerPoint = MapPoint | PlantPoint;

function isPlant(point: LayerPoint): point is PlantPoint {
  return 'squadPlant' in point;
}

/** Layers that can hold points on a side (no enemy plant in attack, no squad plant in defense). */
export function sideLayers(side: Side): MinimapLayer[] {
  return MINIMAP_LAYERS.filter((layer) => !HIDDEN_LAYERS[side].includes(layer.key));
}

/** Points of one layer on one side. */
export function layerPoints(side: MinimapSide | undefined, key: MinimapLayerKey): LayerPoint[] {
  if (!side) {
    return [];
  }
  const layers = side.layers;
  switch (key) {
    case 'plantsSquad':
      return layers.plants.filter((p) => p.squadPlant);
    case 'plantsEnemy':
      return layers.plants.filter((p) => !p.squadPlant);
    case 'plantsTop':
      return [];
    default:
      return layers[key];
  }
}

/** Number of points of every layer, for the toggles; the top ranked plants are summed from their grid. */
export function layerCounts(
  side: MinimapSide | undefined,
  topPlants: readonly DensityCell[] = [],
): Record<MinimapLayerKey, number> {
  const counts = Object.fromEntries(
    MINIMAP_LAYERS.map((layer) => [layer.key, layerPoints(side, layer.key).length]),
  ) as Record<MinimapLayerKey, number>;
  counts.plantsTop = topPlants.reduce((sum, cell) => sum + cell.count, 0);
  return counts;
}

/** Squad player a point belongs to (a plant belongs to its planter, an enemy plant to nobody). */
function owner(point: LayerPoint): string | null {
  return isPlant(point) ? (point.squadPlant ? point.planter : null) : point.player;
}

/** Tip of a point: who, against whom, weapon, zone, revenge, round. */
export function pointTip(layer: MinimapLayer, point: LayerPoint): HoverTipContent {
  const lines: HoverTipLine[] = [];
  const add = (label: string, value: string | null | undefined): void => {
    if (value) {
      lines.push({ label, value });
    }
  };
  if (isPlant(point)) {
    add('Site', point.site);
    add('Posé par', point.planter);
    add('Round', point.won ? 'gagné' : 'perdu');
  } else {
    switch (layer.key) {
      case 'firstBloods':
      case 'kills':
        add('Joueur', point.player);
        add('Victime', point.other);
        break;
      case 'enemyKillerSpots':
        add('Tueur adverse', point.other);
        add('Victime', point.player);
        break;
      default:
        add('Joueur', point.player);
        add('Tué par', point.other);
    }
    add('Arme', point.weapon ?? 'compétence ou inconnue');
    add('Zone', point.zone);
    add('Revenge', point.avenged ? 'oui' : 'non');
  }
  add('Match', `${dayMonth(point.day)} R${point.roundNumber}`);
  return { title: layer.label, lines, note: 'Clic : fiche du round' };
}

/**
 * Markers of the active layers on one side. With a player selected, the other players' points are
 * dimmed rather than hidden so the team picture stays visible.
 */
export function minimapMarkers(
  view: MinimapView,
  side: Side,
  active: ReadonlySet<MinimapLayerKey>,
  player: string,
): MinimapMarker[] {
  const sideData = view.sides[side];
  return sideLayers(side)
    .filter((layer) => active.has(layer.key))
    .flatMap(({ shape, ...layer }) =>
      shape === 'density'
        ? []
        : layerPoints(sideData, layer.key).map((point, index) => ({
            id: `${layer.key}-${index}`,
            x: point.x,
            y: point.y,
            shape,
            color: layer.color,
            dimmed: !!player && owner(point) !== player,
            tip: pointTip({ ...layer, shape }, point),
            link: roundLink(point),
          })),
    );
}

/**
 * Spots of the top ranked plants when their layer is on. Size and opacity follow the square root of
 * the count so the second spot of a site still shows next to the default one.
 */
export function plantSpots(
  cells: readonly DensityCell[],
  active: ReadonlySet<MinimapLayerKey>,
): MinimapDensitySpot[] {
  if (!active.has('plantsTop') || !cells.length) {
    return [];
  }
  const layer = MINIMAP_LAYERS.find((l) => l.key === 'plantsTop') as MinimapLayer;
  const total = cells.reduce((sum, cell) => sum + cell.count, 0);
  const max = Math.max(...cells.map((cell) => cell.count));
  return cells.map((cell) => ({
    id: `${cell.x}-${cell.y}`,
    x: cell.x,
    y: cell.y,
    weight: Math.sqrt(cell.count / max),
    color: layer.color,
    tip: {
      title: layer.label,
      lines: [
        { label: 'Plants', value: `${integer(cell.count)} sur ${integer(total)}` },
        { label: 'Part', value: formatValue(cell.count / total, 'pct') },
      ],
    },
  }));
}

/**
 * Map of the view: the one named in the URL (any case), else the map filter, else the squad's
 * usual map, else the first map of the period.
 */
export function pickMap(
  param: string | undefined,
  filter: string,
  maps: readonly string[],
): string | null {
  const find = (name: string | undefined): string | undefined =>
    name ? maps.find((m) => m.toLowerCase() === name.toLowerCase()) : undefined;
  return find(param) ?? find(filter) ?? find(PREFERRED_MAP) ?? maps[0] ?? null;
}

/** How much more often the squad dies first in the zone than the top ranked (rate points); null without reference. */
export function zoneExcess(row: ZoneRow): number | null {
  if (row.firstDeathShare === null || row.topFirstDeathShare === null) {
    return null;
  }
  return row.firstDeathShare - row.topFirstDeathShare;
}

/** Over-represented past the alert gap on enough first deaths; under-represented past the same gap. */
export function zoneTone(row: ZoneRow): ZoneTone {
  const excess = zoneExcess(row);
  if (excess === null) {
    return 'even';
  }
  if (excess >= ZONE_EXCESS_ALERT && row.firstDeaths >= ZONE_MIN_FIRST_DEATHS) {
    return 'over';
  }
  return excess <= -ZONE_EXCESS_ALERT ? 'under' : 'even';
}

/**
 * Zones with at least one event, the biggest excess of first deaths over the top ranked first, zones
 * without reference last; ties by first deaths then deaths.
 */
export function zoneRows(rows: readonly ZoneRow[]): ZoneRow[] {
  const excess = (row: ZoneRow): number => zoneExcess(row) ?? -Infinity;
  return rows
    .filter((r) => r.firstDeaths || r.deaths || r.kills)
    .sort((a, b) => excess(b) - excess(a) || b.firstDeaths - a.firstDeaths || b.deaths - a.deaths);
}

/**
 * Zone rows ready to draw, in the order of `zoneRows`; `firstDeaths` is the side's total. Below
 * the side minimum no zone is coloured, matching the verdict that says it is too early.
 */
export function zoneLines(rows: readonly ZoneRow[], firstDeaths: number): ZoneLine[] {
  const compare = firstDeaths >= ZONE_MIN_SIDE_FIRST_DEATHS;
  return zoneRows(rows).map((row) => ({
    row,
    players: zonePlayers(row),
    compared: row.firstDeaths > 0 || (row.topFirstDeathShare ?? 0) >= ZONE_MIN_TOP_SHARE,
    share: formatValue(row.firstDeathShare, 'pct'),
    sample: `${row.firstDeaths} sur ${firstDeaths}`,
    topShare: formatValue(row.topFirstDeathShare, 'pct'),
    excess: formatGap(zoneExcess(row), 'pct'),
    tone: compare ? zoneTone(row) : 'even',
    revenge: formatValue(row.revengeRate, 'pct'),
  }));
}

/**
 * Who died in the zone, most deaths first, each with their rounds grouped by match so a date is
 * written once ('01/10 R4 R8'). Matches keep the newest first, rounds are sorted.
 */
export function zonePlayers(row: ZoneRow): ZonePlayerLine[] {
  return row.players.map(({ name, deaths }) => {
    const refs = row.refs.filter((r) => r.player === name).slice(0, MAX_ROUNDS_PER_PLAYER);
    const groups = new Map<string, ZoneMatchGroup>();
    for (const ref of [...refs].sort((a, b) => b.day.localeCompare(a.day))) {
      let group = groups.get(ref.matchId);
      if (!group) {
        group = {
          key: ref.matchId,
          label: dayMonth(ref.day),
          commands: ['/report/matches', ref.matchId],
          rounds: [],
        };
        groups.set(ref.matchId, group);
      }
      group.rounds.push({
        key: `${ref.matchId}_${ref.roundNumber}`,
        label: `R${ref.roundNumber}`,
        commands: roundLink(ref),
        firstDeath: ref.firstDeath,
      });
    }
    for (const group of groups.values()) {
      group.rounds.sort((a, b) => Number(a.label.slice(1)) - Number(b.label.slice(1)));
    }
    return { name, groups: [...groups.values()], more: Math.max(0, deaths - refs.length) };
  });
}

/** Matches behind the zones' deaths. */
export function zoneMatchCount(rows: readonly ZoneRow[]): number {
  return new Set(rows.flatMap((row) => row.refs.map((ref) => ref.matchId))).size;
}

/**
 * The sentence over the zones: too few first deaths to compare, the zones where the squad dies
 * first well above the top ranked, or none.
 */
export function zoneVerdict(
  lines: readonly ZoneLine[],
  firstDeaths: number,
  side: string,
): ZoneVerdict {
  if (firstDeaths < ZONE_MIN_SIDE_FIRST_DEATHS) {
    const count = firstDeaths === 1 ? '1 first death' : `${firstDeaths} first deaths`;
    return {
      text: `Seulement ${count} en ${side} sur la période : trop peu pour comparer les zones au top ranked.`,
      alert: false,
    };
  }
  const over = lines.filter((line) => line.tone === 'over').slice(0, VERDICT_ZONES);
  if (!over.length) {
    return {
      text: "Aucune zone où l'escouade meurt en premier nettement plus souvent que le top ranked.",
      alert: false,
    };
  }
  const names = over.map((line) => `${line.row.zone} (${line.excess})`);
  const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} et ${names.at(-1)}` : names[0];
  return {
    text: `L'escouade meurt en premier bien plus souvent que le top ranked à ${list}.`,
    alert: true,
  };
}
