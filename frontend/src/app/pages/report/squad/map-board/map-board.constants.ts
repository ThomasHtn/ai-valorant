/** Dumbbell of a map line: an SVG 220 wide, shares from 30 % to 75 % across 200 units. */
export const DUMBBELL = { width: 220, start: 10, span: 200, min: 0.3, max: 0.75 } as const;

/** Grid columns of the map table and the width under which it scrolls sideways. */
export const MAP_COLUMNS =
  'minmax(10rem,1.3fr) 5.5rem 5.5rem 5.5rem minmax(13.75rem,1.5fr) 7rem 7rem';
export const MAP_MIN_WIDTH = 880;

/** Side colours, shared by the legend, the tiles and the dumbbell ends. */
export const SIDE_COLORS = {
  attack: 'var(--color-brand-500)',
  defense: 'var(--color-accent-blue)',
} as const;
