import { Reference } from '@core/common/enums.model';

import { ReportFilters, ReportPreferences, ReportScope } from './report-preferences.model';

/** localStorage key prefix of the reading preferences; the view's scope completes it. */
export const PREFERENCES_STORAGE_PREFIX = 'valostats.report.view.';

export const DEFAULT_PREFERENCES: ReportPreferences = {
  reference: 'top',
};

/** Player views compare with opponents of the same role: top ranked paints every cell red. */
export const SCOPE_DEFAULT_REFERENCE: Partial<Record<ReportScope, Reference>> = {
  players: 'opp',
  compare: 'opp',
};

export const NO_FILTERS: ReportFilters = { map: '', side: '', player: '' };
