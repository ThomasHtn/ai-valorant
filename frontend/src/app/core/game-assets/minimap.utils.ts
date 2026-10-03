import { ASSETS_ROOT, KNOWN_MAPS } from './game-assets.constants';
import { assetSlug } from './game-assets.utils';

/**
 * Minimap image of a map, fetched from valorant-api by `scripts/fetch_valorant_assets.py`; null for
 * a map the assets do not know. Positions from the API are fractions of this square image.
 */
export function minimapImage(map: string): string | null {
  return KNOWN_MAPS.has(map) ? `${ASSETS_ROOT}/minimaps/${assetSlug(map)}.webp` : null;
}
