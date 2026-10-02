/** How a period is chosen: a month, a patch, a date range, or nothing for the latest month. */
export interface PeriodQuery {
  month?: string;
  patch?: string;
  start?: string;
  end?: string;
}
