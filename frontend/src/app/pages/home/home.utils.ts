import { monthTitle } from '@core/format/format.utils';
import { SessionListItem } from '@core/sessions/session.model';

import { MonthGroup } from './home.model';

/** Evenings grouped under their month, newest month first; a month without evening keeps its report. */
export function monthGroups(months: string[], sessions: SessionListItem[]): MonthGroup[] {
  const keys = new Set([...months, ...sessions.map((s) => s.day.slice(0, 7))]);
  return [...keys]
    .sort()
    .reverse()
    .map((month) => {
      const inMonth = sessions.filter((s) => s.day.startsWith(month));
      return {
        month,
        title: monthTitle(month),
        sessions: inMonth,
        wins: inMonth.reduce((sum, s) => sum + s.wins, 0),
        losses: inMonth.reduce((sum, s) => sum + s.losses, 0),
      };
    });
}
