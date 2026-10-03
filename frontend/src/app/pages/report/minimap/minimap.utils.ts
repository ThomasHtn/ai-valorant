import { Side } from '@core/common/enums.model';
import { dayMonth } from '@core/format/format.utils';
import { formatValue } from '@core/format/value-format.utils';
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

import { MINIMAP_LAYERS, PREFERRED_MAP } from './minimap-layers.constants';
import { MinimapLayer, MinimapLayerKey } from './minimap-layers.model';

type LayerPoint = MapPoint | PlantPoint;

function isPlant(point: LayerPoint): point is PlantPoint {
  return 'squadPlant' in point;
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
  return MINIMAP_LAYERS.filter((layer) => active.has(layer.key)).flatMap((layer) =>
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

/** Zones with at least one event, by first deaths then deaths. */
export function zoneRows(rows: readonly ZoneRow[]): ZoneRow[] {
  return rows
    .filter((r) => r.firstDeaths || r.deaths || r.kills)
    .sort((a, b) => b.firstDeaths - a.firstDeaths || b.deaths - a.deaths);
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
