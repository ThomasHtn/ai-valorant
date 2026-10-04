import { Params } from '@angular/router';

import { PeriodQuery } from './period-query.model';

const KEYS = ['month', 'patch', 'start', 'end'] as const;

/** The period query carried by the URL (`?month=2026-09`, `?patch=13.05`, `?start=…&end=…`). */
export function periodQueryFromParams(params: Params): PeriodQuery {
  const query: PeriodQuery = {};
  for (const key of KEYS) {
    if (typeof params[key] === 'string' && params[key]) {
      query[key] = params[key];
    }
  }
  return query;
}

/** HTTP and router parameters of a period query, without the empty ones. */
export function periodQueryParams(query: PeriodQuery): Record<string, string> {
  const params: Record<string, string> = {};
  for (const key of KEYS) {
    const value = query[key];
    if (value) {
      params[key] = value;
    }
  }
  return params;
}

/** Same period, so moving between views does not refetch it. */
export function samePeriodQuery(a: PeriodQuery, b: PeriodQuery): boolean {
  return KEYS.every((key) => a[key] === b[key]);
}

/** True for a single session: a range of one day. */
export function isSessionQuery(query: PeriodQuery): boolean {
  return !!query.start && query.start === query.end;
}

/** An evening: a range of one day. */
export function sessionQuery(day: string): PeriodQuery {
  return { start: day, end: day };
}

/**
 * Value of the period selector's option for a query: 'month:2026-09', 'patch:13.05',
 * 'session:2026-10-01' or 'range:2026-05-04:2026-10-01'; '' for the default (latest month).
 */
export function periodOption(query: PeriodQuery): string {
  if (query.month) {
    return `month:${query.month}`;
  }
  if (query.patch) {
    return `patch:${query.patch}`;
  }
  if (query.start && query.end) {
    return query.start === query.end
      ? `session:${query.start}`
      : `range:${query.start}:${query.end}`;
  }
  return '';
}

/** Inverse of `periodOption`. */
export function periodQueryFromOption(option: string): PeriodQuery {
  const [kind, first, second] = option.split(':');
  switch (kind) {
    case 'month':
      return { month: first };
    case 'patch':
      return { patch: first };
    case 'session':
      return sessionQuery(first);
    case 'range':
      return { start: first, end: second };
    default:
      return {};
  }
}
