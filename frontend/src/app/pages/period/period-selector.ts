import { Component, computed, inject, input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideChevronDown } from '@lucide/angular';

import { monthTitle } from '@core/format/format.utils';
import { PeriodsApi } from '@core/periods/periods-api';
import { periodQueryFromOption } from '@core/periods/period-query.utils';
import { resourceValue } from '@core/http/resource-state.utils';

import { PeriodContext } from '@core/periods/period-context';

/** Page name then the months and patches played, as the page title; changing it keeps the page. */
@Component({
  selector: 'app-period-selector',
  imports: [LucideChevronDown],
  templateUrl: './period-selector.html',
  host: { class: 'flex min-w-0 items-center' },
})
export class PeriodSelector {
  /** Report page shown before the period ('Équipe', 'Cartes'...). */
  public readonly page = input<string | null>(null);

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly context = inject(PeriodContext);
  private readonly available = inject(PeriodsApi).available;

  protected readonly months = computed(() => resourceValue(this.available, null)?.months ?? []);
  protected readonly patches = computed(() => resourceValue(this.available, null)?.patches ?? []);

  private readonly overview = computed(() => resourceValue(this.context.overview, null));

  protected readonly title = computed(() => this.overview()?.title ?? 'Période');

  /** Option matching the URL or the default month; empty for a custom date range. */
  protected readonly selected = computed(() => {
    const query = this.context.query();
    if (query.patch) {
      return `patch:${query.patch}`;
    }
    if (query.month) {
      return `month:${query.month}`;
    }
    const key = this.overview()?.key ?? '';
    return !query.start && /^\d{4}-\d{2}$/.test(key) ? `month:${key}` : '';
  });

  protected readonly monthTitle = monthTitle;

  protected select(option: string): void {
    void this.router.navigate([], {
      relativeTo: this.route.firstChild ?? this.route,
      queryParams: periodQueryFromOption(option),
    });
  }
}
