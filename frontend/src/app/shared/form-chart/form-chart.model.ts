/** One match on the form chart. */
export interface FormChartPoint {
  /** Axis label, e.g. '30/09'. */
  label: string;
  value: number;
  /** Hover text of the dot. */
  tooltip: string;
}
