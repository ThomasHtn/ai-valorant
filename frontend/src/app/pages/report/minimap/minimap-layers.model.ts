import { MarkerShape } from '@shared/minimap-canvas/minimap-canvas.model';

/** Layers of the Minimap view; the API's plants are split by who planted, the top ranked ones summed on a grid. */
export type MinimapLayerKey =
  | 'firstDeaths'
  | 'firstBloods'
  | 'deaths'
  | 'kills'
  | 'plantsSquad'
  | 'plantsEnemy'
  | 'plantsTop'
  | 'isolatedDeaths'
  | 'enemyKillerSpots';

/** A marker shape, or soft spots for a density layer. */
export type LayerShape = MarkerShape | 'density';

export interface MinimapLayer {
  key: MinimapLayerKey;
  label: string;
  /** CSS colour of its markers and of its legend symbol. */
  color: string;
  shape: LayerShape;
  /** Glossary topic of its "i", if it needs one. */
  help: string | null;
}
