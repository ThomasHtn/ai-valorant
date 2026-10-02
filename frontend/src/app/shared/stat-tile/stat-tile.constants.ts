/**
 * Strip of headline figures: as many tiles per row as fit, split by hairlines each tile casts on
 * its right and bottom (clipped at the strip's edge). Eight fit one row on a desktop.
 */
export const STAT_BAND_CLASS =
  'grid grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))] overflow-hidden rounded-lg bg-text-primary/4 ring-1 ring-edge ring-inset';

/** Same strip at the foot of a framed header (map hero, player card): no frame of its own. */
export const STAT_BAND_FLUSH_CLASS =
  'grid grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))] overflow-hidden border-t border-edge bg-surface-950/70';
