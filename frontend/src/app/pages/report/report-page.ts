import { Component, inject } from '@angular/core';
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

import { ReportContext } from '@core/report/report-context';
import { ReportOriginTracker } from '@core/report/report-origin';
import { PageHeader } from '@layout/page-header/page-header';
import { ResourceState } from '@shared/resource-state/resource-state';

import { PeriodPulse } from './period-pulse/period-pulse';
import { PeriodSwitcher } from './period-switcher/period-switcher';
import { ReportTabs } from './report-tabs/report-tabs';

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
  /** True while a view's code is being fetched, so the page never sits empty. */
  protected readonly opening = toSignal(
    inject(Router).events.pipe(
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
    // Started here so it sees every report navigation, the first one included.
    inject(ReportOriginTracker);
  }
}
