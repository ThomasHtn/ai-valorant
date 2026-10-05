/** Inputs and drawn geometry of `app-month-chart`. */

/** One line of the chart: a value per month, null where nothing was played. */
export interface MonthSeries {
  key: string;
  label: string;
  /** CSS colour of the line, its dots and its pill. */
  color: string;
  values: (number | null)[];
  /** Value over the whole period, written in the series pill ('48 %'); empty for none. */
  total: string;
  /** Fills the area under the line. */
  area?: boolean;
  /** What the hover tip writes for each month ('51 % (267 sur 528)'); the value alone when missing. */
  details?: (string | null)[];
}

/** One month on the x axis. */
export interface MonthTick {
  /** '2026-07', sent when the month is clicked. */
  key: string;
  label: string;
  /** '27 matchs', under the label. */
  sample: string;
  /** Too few matches: hollow dots. */
  faded: boolean;
}

/** Everything the template draws: positions in percent of the plot (x) and of its height (y). */
export interface MonthChartView {
  grid: { y: number; label: string }[];
  /** Height of the dashed top ranked line, null for none. */
  reference: number | null;
  paths: { key: string; color: string; line: string; area: string | null }[];
  dots: { key: string; x: number; y: number; color: string; faded: boolean; text: string }[];
  /** Axis labels, and the hover zone of each month (from the midpoint before to the one after). */
  ticks: { key: string; x: number; label: string; sample: string; from: number; width: number }[];
}

/** One line of the hover tip: a series' value for the hovered month. */
export interface MonthTipLine {
  key: string;
  label: string;
  color: string;
  value: string;
}
