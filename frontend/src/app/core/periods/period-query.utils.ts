import { Params } from '@angular/router';

import { PeriodQuery } from './period-query.model';

const KEYS = ['month', 'patch', 'start', 'end'] as const;

/** The period query carried by the URL (`?month=2026-09`, `?patch=13.05`, `?start=…&end=…`). */
export function periodQueryFromParams(params: Params): PeriodQuery {
  const query: PeriodQuery = {};
  for (const key of KEYS) {
    if (typeof params[key] === 'string') {
      query[key] = params[key];
    }
  }
  return query;
}

/** HTTP parameters of a period query, without the empty ones. */
export function periodQueryParams(query: PeriodQuery): Record<string, string> {
  return Object.fromEntries(Object.entries(query).filter(([, value]) => value)) as Record<
    string,
    string
  >;
}

/** Same period, so a navigation between tabs does not refetch it. */
export function samePeriodQuery(a: PeriodQuery, b: PeriodQuery): boolean {
  return KEYS.every((key) => a[key] === b[key]);
}

/** Option value of the period selector: 'month:2026-09' or 'patch:13.05'. */
export function periodQueryFromOption(option: string): PeriodQuery {
  const [kind, value] = option.split(':');
  return kind === 'patch' ? { patch: value } : { month: value };
}
