import { computed, signal, WritableSignal } from '@angular/core';

import { Reference } from '@core/common/enums.model';

import {
  NO_FILTERS,
  PREFERENCES_STORAGE_PREFIX,
  REFERENCE_CHOICE_SCOPES,
} from './report-preferences.constants';
import { ReportFilters, ReportPreferences, ReportScope } from './report-preferences.model';
import { hasFilters, parsePreferences } from './report-preferences.utils';

/**
 * Filters and reference of one report view. A choice made on a view only changes that view: the
 * reference is remembered for it in this browser, filters for the session.
 */
export class ViewState {
  public readonly preferences: WritableSignal<ReportPreferences>;
  public readonly filters = signal<ReportFilters>(NO_FILTERS);
  public readonly filtered = computed(() => hasFilters(this.filters()));
  /** Whether the analyst picks the reference here; elsewhere it stays on the top ranked. */
  public readonly referenceChoice: boolean;

  private readonly key: string;

  constructor(
    scope: ReportScope,
    private readonly defaults: ReportPreferences,
    private readonly storage: Storage | null,
  ) {
    this.key = PREFERENCES_STORAGE_PREFIX + scope;
    this.referenceChoice = REFERENCE_CHOICE_SCOPES.has(scope);
    this.preferences = signal(this.read());
  }

  public setReference(reference: Reference): void {
    this.updatePreferences({ reference });
  }

  public setFilter<K extends keyof ReportFilters>(key: K, value: ReportFilters[K]): void {
    this.filters.update((f) => ({ ...f, [key]: value }));
  }

  public resetFilters(): void {
    this.filters.set(NO_FILTERS);
  }

  private updatePreferences(change: Partial<ReportPreferences>): void {
    this.preferences.update((p) => ({ ...p, ...change }));
    // Storage can be missing or throw (private window, blocked site data): the page works without it.
    try {
      this.storage?.setItem(this.key, JSON.stringify(this.preferences()));
    } catch {
      // Not remembered this time; nothing else depends on it.
    }
  }

  private read(): ReportPreferences {
    try {
      return parsePreferences(this.storage?.getItem(this.key) ?? null, this.defaults);
    } catch {
      return this.defaults;
    }
  }
}
