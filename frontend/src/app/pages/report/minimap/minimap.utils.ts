import { Side } from '@core/common/enums.model';
import { dayMonth } from '@core/format/format.utils';
import { formatGap, formatValue } from '@core/format/value-format.utils';
import {
  MapPoint,
  MinimapSide,
  MinimapView,
  PlantPoint,
  ZoneRow,
} from '@core/report/minimap.model';
import { roundLink } from '@core/report/round-ref.utils';
import { HoverTipContent, HoverTipLine } from '@shared/hover-tip/hover-tip.model';
import { MinimapMarker } from '@shared/minimap-canvas/minimap-canvas.model';

import { HIDDEN_LAYERS, MINIMAP_LAYERS, PREFERRED_MAP } from './minimap-layers.constants';
import { MinimapLayer, MinimapLayerKey } from './minimap-layers.model';
import {
  MAX_PLAYERS,
  MAX_REFS,
  ZONE_EXCESS_ALERT,
  ZONE_MIN_FIRST_DEATHS,
} from './zone-table/zone-table.constants';
import { ZoneLine, ZoneTone } from './zone-table/zone-table.model';

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
    default:
      return layers[key];
  }
}

/** Number of points of every layer, for the toggles. */
export function layerCounts(side: MinimapSide | undefined): Record<MinimapLayerKey, number> {
  return Object.fromEntries(
    MINIMAP_LAYERS.map((layer) => [layer.key, layerPoints(side, layer.key).length]),
  ) as Record<MinimapLayerKey, number>;
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
    .flatMap((layer) =>
      layerPoints(sideData, layer.key).map((point, index) => ({
        id: `${layer.key}-${index}`,
        x: point.x,
        y: point.y,
        shape: layer.shape,
        color: layer.color,
        dimmed: !!player && owner(point) !== player,
        tip: pointTip(layer, point),
        link: roundLink(point),
      })),
    );
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

/** Zone rows ready to draw, in the order of `zoneRows`. */
export function zoneLines(rows: readonly ZoneRow[]): ZoneLine[] {
  return zoneRows(rows).map((row) => ({
    row,
    players: row.players
      .slice(0, MAX_PLAYERS)
      .map((p) => `${p.name} ${p.deaths}`)
      .join(', '),
    refs: row.refs.slice(0, MAX_REFS),
    share: formatValue(row.firstDeathShare, 'pct'),
    topShare: formatValue(row.topFirstDeathShare, 'pct'),
    excess: formatGap(zoneExcess(row), 'pct'),
    tone: zoneTone(row),
    shareWidth: Math.min(100, (row.firstDeathShare ?? 0) * 100),
    topTick: row.topFirstDeathShare === null ? null : Math.min(100, row.topFirstDeathShare * 100),
    shareTip: shareTip(row),
    revenge: formatValue(row.revengeRate, 'pct'),
  }));
}

/** Tip of the first-death share bar: squad against top ranked. */
export function shareTip(row: ZoneRow): HoverTipContent {
  return {
    title: 'Part des first deaths',
    lines: [
      { label: "L'escouade", value: formatValue(row.firstDeathShare, 'pct') },
      { label: 'Top ranked', value: formatValue(row.topFirstDeathShare, 'pct') },
    ],
  };
}
