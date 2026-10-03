/** Inputs and drawn geometry of `app-line-chart`. */

/** One value on the x axis (a month, a patch, a match). */
export interface LinePoint {
  /** X axis label ('sept. 2026', '13.06', '30/09'). */
  label: string;
  /** Extra line of the point's tip ('Split 6-13'). */
  detail?: string | null;
  /** Null leaves a gap: nothing was played. */
  value: number | null;
  /** Sample behind the value, written under the axis label; null when not meaningful. */
  sample: number | null;
  /** The report's period: drawn larger with an amber ring. */
  highlighted: boolean;
}

/** A vertical dashed line before a point, e.g. a patch change. */
export interface ChartMarker {
  index: number;
  label: string;
}

/** A plotted point, ready to draw. */
export interface DotView {
  x: number;
  y: number;
  radius: number;
  /** Under the minimum sample: grey. */
  small: boolean;
  highlighted: boolean;
  valueText: string;
  label: string;
  detail: string | null;
  sampleText: string | null;
}

export interface AxisTick {
  /** Pixel position on its axis. */
  at: number;
  label: string;
}

export interface XLabel {
  x: number;
  label: string;
  /** Sample under the label, hidden on dense charts. */
  sample: string | null;
}

export interface MarkerView {
  x: number;
  label: string;
}

/** Everything the template draws, in viewBox units. */
export interface LineChartView {
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  yTicks: AxisTick[];
  xLabels: XLabel[];
  /** SVG `points` attribute of the line, gaps skipped. */
  line: string;
  dots: DotView[];
  markers: MarkerView[];
  reference: { y: number; label: string } | null;
  /** Many points: smaller dots, no value or sample text, one axis label out of N. */
  dense: boolean;
}
