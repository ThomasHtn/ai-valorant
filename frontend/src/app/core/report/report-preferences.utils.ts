import { Reference } from '@core/common/enums.model';

import { DEFAULT_PREFERENCES } from './report-preferences.constants';
import { ReportPreferences } from './report-preferences.model';

const REFERENCES = new Set(['top', 'opp', 'hist']);

/**
 * Preferences read back from storage: any missing or malformed field falls back to its default, so a
 * stale or hand-edited value can never break the page.
 */
export function parsePreferences(raw: string | null): ReportPreferences {
  if (!raw) {
    return DEFAULT_PREFERENCES;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) {
      return DEFAULT_PREFERENCES;
    }
    const saved = value as Partial<Record<keyof ReportPreferences, unknown>>;
    const flag = (key: 'colours' | 'samples' | 'referenceValues'): boolean =>
      typeof saved[key] === 'boolean' ? saved[key] : DEFAULT_PREFERENCES[key];
    const reference = (key: 'reference' | 'playerReference'): Reference =>
      typeof saved[key] === 'string' && REFERENCES.has(saved[key])
        ? (saved[key] as Reference)
        : DEFAULT_PREFERENCES[key];
    return {
      reference: reference('reference'),
      playerReference: reference('playerReference'),
      colours: flag('colours'),
      samples: flag('samples'),
      referenceValues: flag('referenceValues'),
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}
