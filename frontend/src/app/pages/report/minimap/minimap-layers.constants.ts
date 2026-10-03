import { Side } from '@core/common/enums.model';

import { MinimapLayer, MinimapLayerKey } from './minimap-layers.model';

/** Every layer, in the toggle order; shapes keep layers apart without relying on colour alone. */
export const MINIMAP_LAYERS: readonly MinimapLayer[] = [
  {
    key: 'firstDeaths',
    label: 'First deaths',
    color: 'var(--color-rating-bad)',
    shape: 'dot',
    help: 'mmFirstDeaths',
  },
  {
    key: 'firstBloods',
    label: 'First bloods',
    color: 'var(--color-rating-good)',
    shape: 'dot',
    help: 'mmFirstBloods',
  },
  {
    key: 'deaths',
    label: 'Toutes les morts',
    color: 'var(--color-rating-bad)',
    shape: 'ring',
    help: null,
  },
  { key: 'kills', label: 'Kills', color: 'var(--color-rating-good)', shape: 'ring', help: null },
  {
    key: 'plantsSquad',
    label: "Plants de l'escouade",
    color: 'var(--color-brand-500)',
    shape: 'diamond',
    help: null,
  },
  {
    key: 'plantsEnemy',
    label: 'Plants adverses',
    color: 'var(--color-squad)',
    shape: 'diamond',
    help: null,
  },
  {
    key: 'plantsTop',
    label: 'Plants top ranked',
    color: 'var(--color-top-plants)',
    shape: 'density',
    help: 'mmTopPlants',
  },
  {
    key: 'isolatedDeaths',
    label: 'Morts isolées',
    color: 'var(--color-rating-average)',
    shape: 'thickRing',
    help: 'mmIsolated',
  },
  {
    key: 'enemyKillerSpots',
    label: 'Tueurs adverses',
    color: 'var(--color-opponent)',
    shape: 'triangle',
    help: 'mmKillerSpots',
  },
];

/** Opening duels first: they are what the view is mostly opened for. */
export const DEFAULT_LAYERS: ReadonlySet<MinimapLayerKey> = new Set(['firstDeaths', 'firstBloods']);

/** Map shown when the URL names none and the map filter is empty (the squad's most played). */
export const PREFERRED_MAP = 'Split';

/** Layers that are always empty on a side, hidden there: the squad never plants in defense, the enemy never in attack. */
export const HIDDEN_LAYERS: Readonly<Record<Side, readonly MinimapLayerKey[]>> = {
  att: ['plantsEnemy'],
  def: ['plantsSquad'],
};
