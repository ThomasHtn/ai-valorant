import { PeriodQuery } from './period-query.model';
import { MonthEntry, ReportPeriods, SessionEntry } from './report-periods.model';
import { FormMatch } from './period-form.model';

/** Matches of a session in play order, with their round margin. */
export function sessionForm(session: SessionEntry): FormMatch[] {
  return session.scores.map((score, i) => {
    const [won, lost] = score.split('-').map(Number);
    return {
      day: session.day,
      map: session.maps[i] ?? '',
      patch: session.patches[i] ?? '',
      score,
      margin: won - lost,
    };
  });
}

/** Matches of a month, oldest session first. */
export function monthForm(month: MonthEntry): FormMatch[] {
  return [...month.sessions].reverse().flatMap(sessionForm);
}

/** Every match of the tree in play order. */
function historyForm(periods: ReportPeriods): FormMatch[] {
  return [...periods.months].reverse().flatMap(monthForm);
}

/** Matches of the period in play order, from the report tree. No query means the latest month. */
export function periodForm(periods: ReportPeriods, query: PeriodQuery): FormMatch[] {
  if (query.patch) {
    return historyForm(periods).filter((m) => m.patch === query.patch);
  }
  if (query.month || !query.start || !query.end) {
    const month = query.month
      ? periods.months.find((m) => m.key === query.month)
      : periods.months[0];
    return month ? monthForm(month) : [];
  }
  const { start, end } = query;
  return historyForm(periods).filter((m) => m.day >= start && m.day <= end);
}
