import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideChevronRight } from '@lucide/angular';

import { periodQueryParams } from '@core/report/period-query.utils';
import { ReportContext } from '@core/report/report-context';

import { Crumb } from './breadcrumb.model';

/**
 * Where the analyst stands inside a view ('Matchs › Mercredi 30 septembre › Split 6-13'), each step
 * leading back up. Content projected after it (previous / next buttons) is pushed to the right.
 */
@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLink, LucideChevronRight],
  template: `
    <nav aria-label="Fil d'Ariane" class="min-w-0">
      <ol class="m-0 flex list-none flex-wrap items-center gap-x-1.5 gap-y-1 p-0">
        @for (crumb of steps(); track $index; let last = $last) {
          <li class="flex min-w-0 items-center gap-1.5">
            @if (crumb.link && !last) {
              <a
                [routerLink]="crumb.link"
                [queryParams]="crumb.queryParams"
                class="focus-ring text-text-secondary no-underline hover:text-brand-400"
                >{{ crumb.label }}</a
              >
            } @else if (last) {
              <span class="font-semibold text-text-primary" aria-current="page">{{
                crumb.label
              }}</span>
            } @else {
              <span class="text-text-secondary">{{ crumb.label }}</span>
            }
            @if (!last) {
              <svg
                lucideChevronRight
                class="size-4 shrink-0 text-text-muted"
                aria-hidden="true"
              ></svg>
            }
          </li>
        }
      </ol>
    </nav>
    <div class="ml-auto flex items-center gap-1.5">
      <ng-content />
    </div>
  `,
  host: { class: 'flex flex-wrap items-center gap-x-4 gap-y-2 text-[1.05rem]' },
})
export class Breadcrumb {
  public readonly crumbs = input.required<readonly Crumb[]>();

  private readonly context = inject(ReportContext);
  /** Links keep the period and drop the view's filters, unless a step sets its own. */
  protected readonly steps = computed(() => {
    const period = periodQueryParams(this.context.query());
    return this.crumbs().map((crumb) => ({
      ...crumb,
      queryParams: { ...period, ...crumb.queryParams },
    }));
  });
}
