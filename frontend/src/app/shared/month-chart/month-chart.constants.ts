/** Plot box of `app-month-chart`: the SVG stretches it to the card's width. */
export const MONTH_BOX = { width: 1000, height: 100 } as const;

/** Room left and right of the first and last month, in box units. */
export const MONTH_INSET = 40;

/** Gridline step and the margin kept above and under the drawn values (shares, 0..1). */
export const MONTH_GRID_STEP = 0.1;
export const MONTH_RANGE_PAD = 0.02;
