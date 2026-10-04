import {
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';

import { ReportContext } from '@core/report/report-context';
import { periodQueryParams } from '@core/report/period-query.utils';
import { REPORT_MAIN_VIEWS } from '@core/report/report-views.constants';

import { ExploreMenu } from '../explore-menu/explore-menu';
import { reportLocation } from './report-tabs.utils';

/** Selector of the tab being read: a routed tab, or the Explorer menu while it holds the view. */
const ACTIVE_TAB = '.report-tab[aria-current="page"], .report-tab[data-active]';

/**
 * Second row of the top bar: the report's views in reading order, from the whole period down to a
 * round, then Explorer. One amber indicator slides under the active tab; on narrow screens the
 * row scrolls sideways and brings the active tab into view.
 */
@Component({
  selector: 'app-report-tabs',
  imports: [RouterLink, ExploreMenu],
  templateUrl: './report-tabs.html',
  host: { class: 'block' },
})
export class ReportTabs {
  private readonly context = inject(ReportContext);
  private readonly router = inject(Router);
  private readonly nav = viewChild.required<ElementRef<HTMLElement>>('nav');
  private readonly indicator = viewChild.required<ElementRef<HTMLElement>>('indicator');

  protected readonly views = REPORT_MAIN_VIEWS;
  /** Tabs keep the period only: a view's own filters (map, side, round) do not leak into the next. */
  protected readonly periodParams = computed(() => periodQueryParams(this.context.query()));
  protected readonly location = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => reportLocation(e.urlAfterRedirects)),
    ),
    { initialValue: reportLocation(this.router.url) },
  );
  /** Bumped when the row resizes, so the indicator follows its tab. */
  private readonly resized = signal(0);

  constructor() {
    const observer = new ResizeObserver(() => this.resized.update((n) => n + 1));
    inject(DestroyRef).onDestroy(() => observer.disconnect());

    afterRenderEffect(() => {
      this.location();
      this.resized();
      const nav = this.nav().nativeElement;
      observer.observe(nav);
      this.slideTo(nav.querySelector<HTMLElement>(ACTIVE_TAB));
    });
  }

  /** Puts the indicator under a tab; the first placement does not animate. */
  private slideTo(tab: HTMLElement | null): void {
    const bar = this.indicator().nativeElement;
    if (!tab) {
      bar.style.opacity = '0';
      return;
    }
    bar.style.opacity = '1';
    bar.style.width = `${tab.offsetWidth}px`;
    bar.style.transform = `translateX(${tab.offsetLeft}px)`;
    if (!bar.dataset['ready']) {
      requestAnimationFrame(() => (bar.dataset['ready'] = 'true'));
    }
    tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}
