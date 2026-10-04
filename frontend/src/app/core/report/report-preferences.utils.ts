import { Reference } from '@core/common/enums.model';

import { ReportFilters, ReportPreferences } from './report-preferences.model';

const REFERENCES = new Set(['top', 'opp', 'hist']);

/**
 * Preferences read back from storage: any missing or malformed field falls back to its default, so a
 * stale or hand-edited value can never break the page.
 */
export function parsePreferences(
  raw: string | null,
  defaults: ReportPreferences,
): ReportPreferences {
  if (!raw) {
    return defaults;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) {
      return defaults;
    }
    const saved = value as Partial<Record<keyof ReportPreferences, unknown>>;
    return {
      reference:
        typeof saved.reference === 'string' && REFERENCES.has(saved.reference)
          ? (saved.reference as Reference)
          : defaults.reference,
    };
  } catch {
    return defaults;
  }
}

/** True when at least one scope filter narrows the view. */
export function hasFilters(filters: ReportFilters): boolean {
  return Boolean(filters.map || filters.side || filters.player);
}
