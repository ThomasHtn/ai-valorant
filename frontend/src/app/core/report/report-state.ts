import { DOCUMENT } from '@angular/common';
import { effect, inject, Service, signal } from '@angular/core';

import { Reference } from '@core/common/enums.model';

import {
  DEFAULT_PREFERENCES,
  NO_FILTERS,
  PREFERENCES_STORAGE_KEY,
} from './report-preferences.constants';
import { ReportFilters, ReportPreferences } from './report-preferences.model';
import { parsePreferences } from './report-preferences.utils';

/**
 * How the analyst reads a report, shared by every view: the reference cells are compared with, the
 * display toggles and the scope filters (map, side, player). Preferences are remembered in this
 * browser only; filters reset with the page.
 */
@Service()
export class ReportState {
  private readonly storage = inject(DOCUMENT).defaultView?.localStorage ?? null;

  public readonly preferences = signal<ReportPreferences>(this.readPreferences());
  public readonly filters = signal<ReportFilters>(NO_FILTERS);

  constructor() {
    effect(() => this.writePreferences(this.preferences()));
  }

  public setReference(reference: Reference): void {
    this.preferences.update((p) => ({ ...p, reference }));
  }

  /** Reference of the Joueurs view only; the other views keep `reference`. */
  public setPlayerReference(playerReference: Reference): void {
    this.preferences.update((p) => ({ ...p, playerReference }));
  }

  /** Flips one display toggle (colours, samples, reference values). */
  public toggle(key: 'colours' | 'samples' | 'referenceValues'): void {
    this.preferences.update((p) => ({ ...p, [key]: !p[key] }));
  }

  public setFilter<K extends keyof ReportFilters>(key: K, value: ReportFilters[K]): void {
    this.filters.update((f) => ({ ...f, [key]: value }));
  }

  public resetFilters(): void {
    this.filters.set(NO_FILTERS);
  }

  // Storage can be missing or throw (private window, blocked site data): the page works without it.
  private readPreferences(): ReportPreferences {
    try {
      return parsePreferences(this.storage?.getItem(PREFERENCES_STORAGE_KEY) ?? null);
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }

  private writePreferences(preferences: ReportPreferences): void {
    try {
      this.storage?.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Not remembered this time; nothing else depends on it.
    }
  }
}
