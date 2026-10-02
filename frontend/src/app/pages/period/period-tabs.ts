import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';

import { PERIOD_TABS } from '@core/navigation/period-nav.constants';
import { PeriodContext } from '@core/periods/period-context';
import { periodQueryParams } from '@core/periods/period-query.utils';

import { PERIOD_TAB_CLASS } from './period-tabs.constants';

/** Team, maps and players of the report, in its header; following one keeps the period. */
@Component({
  selector: 'app-period-tabs',
  imports: [RouterLink, LucideDynamicIcon],
  template: `
    <nav class="flex gap-6 sm:-mb-px" aria-label="Pages du rapport">
      @for (tab of tabs; track tab.path) {
        <a
          [routerLink]="['/periods', tab.path]"
          [queryParams]="params()"
          [class]="tabClass"
          [attr.aria-current]="tab.path === selected() ? 'page' : null"
        >
          <svg class="size-4 shrink-0" [lucideIcon]="tab.icon" aria-hidden="true"></svg>
          {{ tab.label }}
        </a>
      }
    </nav>
  `,
  host: { class: 'order-last flex w-full sm:order-none sm:w-auto' },
})
export class PeriodTabs {
  /** Path of the page shown ('team', 'maps', 'players'). */
  public readonly selected = input.required<string>();

  private readonly period = inject(PeriodContext);

  protected readonly tabs = PERIOD_TABS;
  protected readonly tabClass = PERIOD_TAB_CLASS;
  protected readonly params = computed(() => periodQueryParams(this.period.query()));
}
