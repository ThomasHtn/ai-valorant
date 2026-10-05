import { REPORT_ROOT } from '@core/report/report-context';
import {
  DEFAULT_DOMAIN,
  DETECTIONS_KEY,
  DETECTIONS_LABEL,
  REPORT_DOMAINS,
} from '@core/report/report-domains.constants';
import { PeriodQuery } from '@core/report/period-query.model';
import { isSessionQuery } from '@core/report/period-query.utils';
import { REPORT_STATS_VIEW, REPORT_TOOL_VIEWS } from '@core/report/report-views.constants';

import { ReportLocation } from './report-tabs.model';

/** View and sub-page of a report URL, nulls outside the report. */
export function reportLocation(url: string): ReportLocation {
  const path = url.split(/[?#]/)[0];
  if (!path.startsWith(`${REPORT_ROOT}/`)) {
    return { view: null, sub: null };
  }
  const [view, sub] = path.slice(REPORT_ROOT.length + 1).split('/');
  return { view: view || null, sub: sub || null };
}

/** Name of the Explorer entry being read ('Économie', 'Comparer'), null on a tab's view. */
export function exploreLabel(location: ReportLocation): string | null {
  if (location.view === REPORT_STATS_VIEW.path) {
    if (location.sub === DETECTIONS_KEY) {
      return DETECTIONS_LABEL;
    }
    const key = location.sub ?? DEFAULT_DOMAIN;
    return REPORT_DOMAINS.find((d) => d.key === key)?.label ?? REPORT_STATS_VIEW.label;
  }
  return REPORT_TOOL_VIEWS.find((v) => v.path === location.view)?.label ?? null;
}

/** A session period opens its page under Sessions, read inside its month; null otherwise. */
export function redirectFor(
  location: ReportLocation,
  query: PeriodQuery,
): { commands: string[]; queryParams: Record<string, string> } | null {
  // A round page keeps its period: it is reached from a session's match list.
  if (!isSessionQuery(query) || !query.start || location.view === 'matches') {
    return null;
  }
  return {
    commands: ['/report/sessions', query.start],
    queryParams: { month: query.start.slice(0, 7) },
  };
}
