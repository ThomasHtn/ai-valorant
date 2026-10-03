import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { resourceValue } from '@core/http/resource-state.utils';
import {
  periodOption,
  periodQueryFromOption,
  periodQueryParams,
} from '@core/report/period-query.utils';
import { ReportContext } from '@core/report/report-context';

import { periodOptionGroups } from './period-selector.utils';

/**
 * Title of a report that is also its period picker: a transparent select lies over the title, so
 * the title never clips and the browser's own picker opens. Changing it keeps the current view and
 * swaps the period in the URL; the default period (no query) shows the meta's title.
 */
@Component({
  selector: 'app-period-selector',
  template: `
    <span
      class="font-display text-2xl leading-tight font-semibold text-brand-500 uppercase sm:text-[1.9rem]"
      aria-hidden="true"
      >{{ title() }}</span
    >
    <svg
      class="size-5 shrink-0 text-brand-500"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
    <!-- The real control, transparent over the title: native keyboard and phone pickers for free. -->
    <select
      id="report-period"
      aria-label="Période du rapport"
      class="absolute inset-0 cursor-pointer appearance-none opacity-0 [&_optgroup]:bg-surface-sunken [&_optgroup]:text-text-muted [&_option]:bg-surface-sunken [&_option]:text-text-primary"
      (change)="choose($event)"
    >
      @if (!selected()) {
        <option value="" selected>{{ title() }}</option>
      }
      @for (group of groups(); track group.label) {
        <optgroup [label]="group.label">
          @for (option of group.options; track option.value) {
            <option [value]="option.value" [selected]="option.value === selected()">
              {{ option.label }}
            </option>
          }
        </optgroup>
      }
    </select>
  `,
  host: {
    class:
      'relative inline-flex max-w-full items-center gap-1.5 px-1 transition-colors hover:bg-brand-500/8 has-focus-visible:outline-2 has-focus-visible:outline-brand-500',
  },
})
export class PeriodSelector {
  private readonly context = inject(ReportContext);
  private readonly router = inject(Router);

  protected readonly groups = computed(() => {
    const periods = resourceValue(this.context.periods, null);
    return periods ? periodOptionGroups(periods) : [];
  });
  protected readonly selected = computed(() => periodOption(this.context.query()));
  /** Label of the selected option, or the meta's title for the default period. */
  protected readonly title = computed(() => {
    const value = this.selected();
    const option = this.groups()
      .flatMap((g) => g.options)
      .find((o) => o.value === value);
    return option?.label ?? resourceValue(this.context.meta, null)?.title ?? 'Rapport';
  });

  /** Same view, new period. */
  protected choose(event: Event): void {
    const query = periodQueryFromOption((event.target as HTMLSelectElement).value);
    const tree = this.router.parseUrl(this.router.url);
    tree.queryParams = periodQueryParams(query);
    void this.router.navigateByUrl(tree);
  }
}
