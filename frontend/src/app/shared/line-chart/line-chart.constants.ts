/**
 * Drawing box of the line chart in CSS pixels. `width` is only the default: the chart draws at its
 * container's width, so the height and the texts stay at their real size.
 */
export const LINE_CHART_BOX = {
  width: 1000,
  height: 280,
  left: 56,
  right: 24,
  top: 34,
  bottom: 58,
};

/** Room between the axis and the first and last points, so their value labels clear the ticks. */
export const POINT_INSET = 28;

/** Beyond this many points the chart hides per-point texts and thins the axis labels. */
export const DENSE_POINTS = 20;

/** About how many x axis labels a dense chart keeps. */
export const DENSE_LABELS = 16;

/** Dot radius: normal, dense, period of the report. */
export const DOT_RADIUS = { normal: 5.5, dense: 3.5, highlighted: 7 };
