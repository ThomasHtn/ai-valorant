/** Drawing box of the line chart, in viewBox units (the SVG scales to its container's width). */
export const LINE_CHART_BOX = {
  width: 1000,
  height: 360,
  left: 56,
  right: 24,
  top: 34,
  bottom: 58,
};

/** Beyond this many points the chart hides per-point texts and thins the axis labels. */
export const DENSE_POINTS = 20;

/** About how many x axis labels a dense chart keeps. */
export const DENSE_LABELS = 16;

/** Dot radius: normal, dense, period of the report. */
export const DOT_RADIUS = { normal: 5.5, dense: 3.5, highlighted: 7 };
