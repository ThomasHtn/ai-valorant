import { GameArtSize } from './game-art.model';

/** Side of an agent portrait per size. */
export const AGENT_ICON_SIZES: Record<GameArtSize, string> = {
  sm: 'size-6',
  md: 'size-8',
  lg: 'size-14',
};

/** Side of a map thumbnail per size; a touch larger than a portrait so the place stays readable. */
export const MAP_THUMB_SIZES: Record<GameArtSize, string> = {
  sm: 'size-7',
  md: 'size-10',
  lg: 'size-14',
};

/** Square frame, shared by agent portraits and map thumbnails. */
export const GAME_ART_FRAME_CLASS =
  'inline-grid shrink-0 place-items-center overflow-hidden bg-surface-700';
