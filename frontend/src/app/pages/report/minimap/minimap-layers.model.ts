import { MarkerShape } from '@shared/minimap-canvas/minimap-canvas.model';

/** Layers of the Minimap view; the API's plants are split by who planted. */
export type MinimapLayerKey =
  | 'firstDeaths'
  | 'firstBloods'
  | 'deaths'
  | 'kills'
  | 'plantsSquad'
  | 'plantsEnemy'
  | 'isolatedDeaths'
  | 'enemyKillerSpots';

export interface MinimapLayer {
  key: MinimapLayerKey;
  label: string;
  /** CSS colour of its markers and of its legend symbol. */
  color: string;
  shape: MarkerShape;
  /** Glossary topic of its "i", if it needs one. */
  help: string | null;
}
