/** Drawing box of the chart in SVG units; the SVG scales to its container. */
export const CHART_SIZE = { width: 640, height: 190, left: 40, right: 12, top: 12, bottom: 26 };
/** The time axis spans at least a full round (100 s) so short rounds keep their proportions. */
export const MIN_ROUND_MS = 100_000;
/** One time label every 20 seconds. */
export const TICK_STEP_MS = 20_000;
/** Every round starts even. */
export const START_PROBABILITY = 0.5;
