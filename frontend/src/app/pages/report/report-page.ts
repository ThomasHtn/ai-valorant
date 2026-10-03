import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter, map, of, switchMap, timer } from 'rxjs';

import { freshness } from '@core/format/format.utils';
import { integer } from '@core/format/value-format.utils';
import { ReportContext } from '@core/report/report-context';
import { periodQueryParams } from '@core/report/period-query.utils';
import { REPORT_MAIN_VIEWS, REPORT_TOOL_VIEWS } from '@core/report/report-views.constants';
import { PageHeader } from '@layout/page-header/page-header';
import { DataQuality } from '@shared/data-quality/data-quality';
import { ResourceState } from '@shared/resource-state/resource-state';

import { PeriodSelector } from './period-selector/period-selector';

/** A view taking longer than this to open shows the loader; quicker ones do not flash it. */
const LOADER_DELAY_MS = 200;

/**
 * Frame of every report view: the period as a title, its facts, and the view tabs (ValoQuests
 * overview tabs) grouped by job. The period stays in the URL's query when moving between views.
 */
@Component({
  selector: 'app-report-page',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NgTemplateOutlet,
    PageHeader,
    DataQuality,
    ResourceState,
    PeriodSelector,
  ],
  host: { class: 'page-stack' },
  templateUrl: './report-page.html',
})
export class ReportPage {
  protected readonly context = inject(ReportContext);
  protected readonly mainViews = REPORT_MAIN_VIEWS;
  protected readonly toolViews = REPORT_TOOL_VIEWS;
  /** Tabs keep the period only: a view's own filters (map, side, round) do not leak into the next. */
  protected readonly periodParams = computed(() => periodQueryParams(this.context.query()));
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
  protected readonly integer = integer;
  protected readonly freshness = freshness;

  /** Brings the active tab into the bar's view on narrow screens, where the bar scrolls sideways. */
  protected reveal(tab: HTMLElement): void {
    tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}
