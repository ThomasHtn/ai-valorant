/** Below this many tries a rate is shown muted, without colour: it would mostly be noise. */
export const HEAT_MIN_TOTAL = 5;
/** Gap to the center that gets the full colour (0.3 = 30 points). */
export const HEAT_DEFAULT_SPAN = 0.3;
/** Within this gap of the center the cell reads average (amber), not better or worse. */
export const HEAT_AVERAGE_BAND = 0.03;
/** Opacity range of the green and red tints, in percent, from just past the band to full span. */
export const HEAT_MIN_OPACITY = 14;
export const HEAT_MAX_OPACITY = 42;
/** Opacity of the amber tint of an average cell. */
export const HEAT_AVERAGE_OPACITY = 14;
