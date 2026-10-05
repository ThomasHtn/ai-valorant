import { Reference } from '@core/common/enums.model';

import { ReportFilters, ReportPreferences, ReportScope } from './report-preferences.model';

/** localStorage key prefix of the reading preferences; the view's scope completes it. */
export const PREFERENCES_STORAGE_PREFIX = 'valostats.report.view.';

export const DEFAULT_PREFERENCES: ReportPreferences = {
  reference: 'top',
};

/** Comparer defaults to the opponents; every other view always reads against the top ranked. */
export const SCOPE_DEFAULT_REFERENCE: Partial<Record<ReportScope, Reference>> = {
  compare: 'opp',
};

/** The only view where the analyst picks the reference; the others are fixed on the top ranked. */
export const REFERENCE_CHOICE_SCOPES: ReadonlySet<ReportScope> = new Set(['compare']);

export const NO_FILTERS: ReportFilters = { map: '', side: '', player: '' };
