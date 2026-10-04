import { longDay, monthTitle, shortDay } from '@core/format/format.utils';
import { PeriodQuery } from '@core/report/period-query.model';
import { ReportPeriods } from '@core/report/report-periods.model';

/** Title of the period being read; no query means the latest month. */
export function periodTitle(query: PeriodQuery, periods: ReportPeriods | null): string {
  if (query.month) {
    return monthTitle(query.month);
  }
  if (query.patch) {
    return `Patch ${query.patch}`;
  }
  if (query.start && query.end) {
    if (query.start === query.end) {
      return `Session du ${longDay(query.start).toLowerCase()}`;
    }
    if (periods && query.start === periods.firstDay && query.end === periods.lastDay) {
      return "Tout l'historique";
    }
    return `Du ${longDay(query.start).toLowerCase()} au ${longDay(query.end).toLowerCase()}`;
  }
  const latest = periods?.months[0]?.key;
  return latest ? monthTitle(latest) : 'Rapport';
}

/** Month whose sessions the panel shows first: the one read, or the latest. */
export function focusMonth(query: PeriodQuery, periods: ReportPeriods): string | null {
  const day = query.start === query.end ? query.start : undefined;
  const key = query.month ?? day?.slice(0, 7);
  return periods.months.some((m) => m.key === key) ? key! : (periods.months[0]?.key ?? null);
}

/** 'de septembre 2026', "d'octobre 2026": French elision before a vowel. */
export function ofMonth(month: string): string {
  const title = monthTitle(month).toLowerCase();
  return /^[aeiouy]/.test(title) ? `d'${title}` : `de ${title}`;
}

/** Share of matches won, 0..1; 0 without matches. */
export function winShare(wins: number, losses: number): number {
  return wins + losses ? wins / (wins + losses) : 0;
}

/** 'Mer. 30 sept.': a session row's day, capitalised like a list entry. */
export function sessionDay(day: string): string {
  const text = shortDay(day);
  return text.charAt(0).toUpperCase() + text.slice(1);
}
