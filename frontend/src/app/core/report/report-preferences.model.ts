import { Reference, Side } from '@core/common/enums.model';

/** How the analyst reads the figures of one view; remembered per view in this browser. */
export interface ReportPreferences {
  reference: Reference;
  /** Colour cells against the reference. */
  colours: boolean;
  /** Write the sample under each value. */
  samples: boolean;
  /** Write the reference value under each value. */
  referenceValues: boolean;
}

/** Scope filters of one view; empty means everything. */
export interface ReportFilters {
  map: string;
  side: Side | '';
  player: string;
}

/** Report views that keep their own filters and display options. */
export type ReportScope =
  'summary' | 'findings' | 'tables' | 'compare' | 'minimap' | 'players' | 'distribution';
