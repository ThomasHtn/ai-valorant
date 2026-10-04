import { Component, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterOutlet,
} from '@angular/router';
import { filter, map, of, switchMap, timer } from 'rxjs';

import { isSessionQuery, periodQueryParams } from '@core/report/period-query.utils';
import { ReportContext } from '@core/report/report-context';
import { PageHeader } from '@layout/page-header/page-header';
import { ResourceState } from '@shared/resource-state/resource-state';

import { PeriodPulse } from './period-pulse/period-pulse';
import { PeriodSwitcher } from './period-switcher/period-switcher';
import { ReportTabs } from './report-tabs/report-tabs';
import { reportLocation, viewForPeriod } from './report-tabs/report-tabs.utils';

/** A view taking longer than this to open shows the loader; quicker ones do not flash it. */
const LOADER_DELAY_MS = 200;

/**
 * Frame of every report view: one top bar holding the period (its switcher and its form at a
 * glance) over the view tabs, then the routed view. The period stays in the URL's query when moving
 * between views.
 */
@Component({
  selector: 'app-report-page',
  imports: [RouterOutlet, PageHeader, ResourceState, PeriodSwitcher, PeriodPulse, ReportTabs],
  host: { class: 'page-stack' },
  templateUrl: './report-page.html',
})
export class ReportPage {
  protected readonly context = inject(ReportContext);
  private readonly router = inject(Router);
  /** True while a view's code is being fetched, so the page never sits empty. */
  protected readonly opening = toSignal(
    this.router.events.pipe(
      filter(
        (e) =>
          e instanceof NavigationStart ||
          e instanceof NavigationEnd ||
          e instanceof NavigationCancel ||
          e instanceof NavigationError,
      ),
      switchMap((e) =>
        e instanceof NavigationStart ? timer(LOADER_DELAY_MS).pipe(map(() => true)) : of(false),
      ),
    ),
    { initialValue: false },
  );

  constructor() {
    // A period that does not offer the open view (Minimap on a session) opens its first view.
    effect(() => {
      const session = isSessionQuery(this.context.query());
      const url = this.context.url();
      const target = viewForPeriod(reportLocation(url).view, session);
      if (target) {
        void this.router.navigate(['/report', target], {
          queryParams: periodQueryParams(this.context.query()),
          replaceUrl: true,
        });
      }
    });
  }
}
