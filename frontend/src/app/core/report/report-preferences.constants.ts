import { ReportFilters, ReportPreferences } from './report-preferences.model';

/** localStorage key of the reading preferences. */
export const PREFERENCES_STORAGE_KEY = 'valostats.report.preferences';

export const DEFAULT_PREFERENCES: ReportPreferences = {
  reference: 'top',
  playerReference: 'opp',
  colours: true,
  samples: false,
  referenceValues: false,
};

export const NO_FILTERS: ReportFilters = { map: '', side: '', player: '' };
