import { MONTHS } from '@core/format/labels.constants';

import { PeriodQuery } from './period-query.model';

/** 'mai' or "d'août" style month name, lower case, from '2026-09'. */
function monthName(month: string): string {
  return MONTHS[Number(month.slice(5, 7)) - 1];
}

/** '4 mai' from an ISO day. */
function dayName(iso: string): string {
  return `${Number(iso.slice(8, 10))} ${monthName(iso.slice(0, 7))}`;
}

/**
 * What the squad's history means for this period, as a label: 'Avant septembre', 'Avant le patch
 * 13.05', 'Avant le 30 septembre'. `latestMonth` names the default period (no query).
 */
export function historyLabel(query: PeriodQuery, latestMonth: string | null): string {
  const month = query.month ?? (query.patch || query.start ? null : latestMonth);
  if (month) {
    return `Avant ${monthName(month)}`;
  }
  if (query.patch) {
    return `Avant le patch ${query.patch}`;
  }
  return query.start ? `Avant le ${dayName(query.start)}` : 'Avant la période';
}
