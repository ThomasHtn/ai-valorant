import { Component, ElementRef, computed, inject, input, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideChartColumn,
  LucideChevronDown,
  LucideCompass,
  LucideGitCompareArrows,
  LucideSiren,
  LucideTrendingUp,
} from '@lucide/angular';

import { ReportContext } from '@core/report/report-context';
import {
  DETECTIONS_KEY,
  DETECTIONS_LABEL,
  REPORT_DOMAINS,
} from '@core/report/report-domains.constants';
import { periodQueryParams } from '@core/report/period-query.utils';
import { REPORT_STATS_VIEW, REPORT_TOOL_VIEWS } from '@core/report/report-views.constants';
import { applyPlacement, placeUnder, remToPx } from '@shared/popover/popover.utils';

import { ReportLocation } from '../report-tabs/report-tabs.model';
import { exploreLabel } from '../report-tabs/report-tabs.utils';
import { EXPLORE_MENU_WIDTH_REM } from './explore-menu.constants';

/**
 * Last tab of the report: one menu instead of a tab per tool. It opens on every statistic by theme
 * (Alertes first) and the tools (Comparer, Évolution, Répartition); while one of them is read, the
 * tab takes its name.
 */
@Component({
  selector: 'app-explore-menu',
  imports: [
    RouterLink,
    LucideChartColumn,
    LucideChevronDown,
    LucideCompass,
    LucideGitCompareArrows,
    LucideSiren,
    LucideTrendingUp,
  ],
  templateUrl: './explore-menu.html',
  host: { class: 'contents' },
})
export class ExploreMenu {
  public readonly location = input.required<ReportLocation>();

  private readonly context = inject(ReportContext);
  private readonly trigger = viewChild.required<ElementRef<HTMLElement>>('trigger');
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');

  protected readonly domains = REPORT_DOMAINS;
  protected readonly tools = REPORT_TOOL_VIEWS;
  protected readonly statsPath = `/report/${REPORT_STATS_VIEW.path}`;
  protected readonly detectionsKey = DETECTIONS_KEY;
  protected readonly detectionsLabel = DETECTIONS_LABEL;
  protected readonly periodParams = computed(() => periodQueryParams(this.context.query()));
  /** Name of the entry being read, null while a tab's view is shown. */
  protected readonly activeLabel = computed(() => exploreLabel(this.location()));
  /** Theme key being read in Stats par thème, so its entry shows as selected. */
  protected readonly activeTheme = computed(() => {
    const { view, sub } = this.location();
    return view === REPORT_STATS_VIEW.path ? (sub ?? this.domains[0].key) : null;
  });

  /** Pins the panel under the tab just before it shows. */
  protected place(event: Event): void {
    if ((event as ToggleEvent).newState !== 'open') {
      return;
    }
    const placement = placeUnder(
      this.trigger().nativeElement.getBoundingClientRect(),
      remToPx(EXPLORE_MENU_WIDTH_REM),
      { width: window.innerWidth, height: window.innerHeight },
    );
    applyPlacement(this.panel().nativeElement, placement);
  }

  protected close(): void {
    this.panel().nativeElement.hidePopover();
  }
}
