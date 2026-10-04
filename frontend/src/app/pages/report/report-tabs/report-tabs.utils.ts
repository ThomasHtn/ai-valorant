import { REPORT_ROOT } from '@core/report/report-context';
import {
  DEFAULT_DOMAIN,
  DETECTIONS_KEY,
  DETECTIONS_LABEL,
  REPORT_DOMAINS,
} from '@core/report/report-domains.constants';
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
