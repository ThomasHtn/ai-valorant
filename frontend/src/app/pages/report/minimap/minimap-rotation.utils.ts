import { nextRotation } from '@shared/minimap-canvas/minimap-canvas.utils';

/** localStorage key prefix of the minimap turn, one per map. */
const ROTATION_KEY_PREFIX = 'valostats.minimap.rotation.';

const TURNS = new Set([0, 90, 180, 270]);

/** Turn saved for a map, 0 when none or when storage is unavailable. */
export function readRotation(map: string, storage: Storage | null): number {
  try {
    const saved = Number(storage?.getItem(ROTATION_KEY_PREFIX + map.toLowerCase()));
    return TURNS.has(saved) ? saved : 0;
  } catch {
    return 0;
  }
}

/** Next quarter turn of a map, saved when storage allows it. */
export function turnMap(map: string, rotation: number, storage: Storage | null): number {
  const next = nextRotation(rotation);
  try {
    storage?.setItem(ROTATION_KEY_PREFIX + map.toLowerCase(), String(next));
  } catch {
    // Not remembered this time; the turn still applies.
  }
  return next;
}
