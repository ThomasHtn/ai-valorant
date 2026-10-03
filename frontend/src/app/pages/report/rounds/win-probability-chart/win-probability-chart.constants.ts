/** Drawing box of the chart in CSS pixels; the width follows the container, the height stays fixed. */
export const CHART_SIZE = { width: 640, height: 150, left: 40, right: 12, top: 12, bottom: 24 };
/** The time axis ends at the round's last event, never shorter than this so early ends stay readable. */
export const MIN_AXIS_MS = 20_000;
/** One time label every 20 seconds. */
export const TICK_STEP_MS = 20_000;
/** Every round starts even. */
export const START_PROBABILITY = 0.5;
/** Room the key moment label needs right of its line before it flips to the left (SVG units). */
export const KEY_LABEL_WIDTH = 110;
