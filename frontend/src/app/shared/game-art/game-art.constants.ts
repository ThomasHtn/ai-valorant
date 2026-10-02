import { GameArtSize } from './game-art.model';

/** Side of an agent portrait per size. */
export const AGENT_ICON_SIZES: Record<GameArtSize, string> = {
  sm: 'size-6 [--notch:0.25rem]',
  md: 'size-8 [--notch:0.3125rem]',
  lg: 'size-14 [--notch:0.5rem]',
};

/** Side of a map thumbnail per size; a touch larger than a portrait so the place stays readable. */
export const MAP_THUMB_SIZES: Record<GameArtSize, string> = {
  sm: 'size-7 [--notch:0.3125rem]',
  md: 'size-10 [--notch:0.375rem]',
  lg: 'size-14 [--notch:0.5rem]',
};

/** Square, top-right-cut frame shared by agent portraits and map thumbnails, as in ValoQuests. */
export const GAME_ART_FRAME_CLASS =
  'notch-tr inline-grid shrink-0 place-items-center overflow-hidden bg-surface-700';
