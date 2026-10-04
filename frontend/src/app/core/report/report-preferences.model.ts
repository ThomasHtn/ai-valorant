import { Reference, Side } from '@core/common/enums.model';

/** How the analyst reads the figures of one view; remembered per view in this browser. */
export interface ReportPreferences {
  reference: Reference;
}

/** Scope filters of one view; empty means everything. */
export interface ReportFilters {
  map: string;
  side: Side | '';
  player: string;
}

/** Report views that keep their own filters and display options. */
export type ReportScope = 'summary' | 'tables' | 'compare' | 'minimap' | 'players' | 'distribution';
