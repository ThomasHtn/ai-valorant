import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

import { PERIOD_TABS } from '@core/navigation/period-nav.constants';
import { PeriodContext } from '@core/periods/period-context';
import { PageHeader } from '@layout/page-header/page-header';
import { Badge } from '@shared/badge/badge';
import { InfoTip } from '@shared/info-tip/info-tip';
import { ResourceState } from '@shared/resource-state/resource-state';

import { PeriodSelector } from './period-selector';
import { PeriodTabs } from './period-tabs';

/**
 * Period report: the period picker as title, the report's pages as tabs beside it, its context on the
 * right, then the routed page (team, maps or players).
 */
@Component({
  selector: 'app-period-page',
  imports: [RouterOutlet, PageHeader, ResourceState, PeriodSelector, PeriodTabs, Badge, InfoTip],
  host: { class: 'page-stack' },
  templateUrl: './period-page.html',
})
export class PeriodPage {
  protected readonly overview = inject(PeriodContext).overview;

  private readonly router = inject(Router);

  /** Tab segment of the URL (`/periods/maps/Ascent` -> 'maps'). */
  protected readonly tab = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.tabOf(this.router.url)),
    ),
    { initialValue: this.tabOf(this.router.url) },
  );

  protected readonly pageLabel = computed(
    () => PERIOD_TABS.find((t) => t.path === this.tab())?.label ?? null,
  );

  private tabOf(url: string): string {
    return url.split(/[?#]/)[0].split('/')[2] ?? '';
  }
}
