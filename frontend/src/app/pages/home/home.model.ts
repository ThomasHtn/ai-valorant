import { SessionListItem } from '@core/sessions/session.model';

/** A month of the report tree: its full report and the evenings played in it. */
export interface MonthGroup {
  /** `YYYY-MM`, the period query of the month's report. */
  month: string;
  title: string;
  sessions: SessionListItem[];
  wins: number;
  losses: number;
}
