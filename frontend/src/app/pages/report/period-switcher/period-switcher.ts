import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { LucideChevronDown, LucideHistory } from '@lucide/angular';

import { freshness, monthTitle } from '@core/format/format.utils';
import { integer } from '@core/format/value-format.utils';
import { resourceValue } from '@core/http/resource-state.utils';
import { sessionForm } from '@core/report/period-form.utils';
import { PeriodQuery } from '@core/report/period-query.model';
import { periodOption, periodQueryParams, sessionQuery } from '@core/report/period-query.utils';
import { ReportContext } from '@core/report/report-context';
import { FormStrip } from '@shared/form-strip/form-strip';
import { applyPlacement, placeUnder, remToPx } from '@shared/popover/popover.utils';

import { PERIOD_PANEL_WIDTH_REM } from './period-switcher.constants';
import { focusMonth, ofMonth, periodTitle, sessionDay, winShare } from './period-switcher.utils';

/**
 * Title of the report that opens every period it can show: months on the left, the sessions of the
 * month under the pointer on the right, patches and the whole history below. This is the app's
 * home: picking a period keeps the view being read and swaps the period in the URL.
 */
@Component({
  selector: 'app-period-switcher',
  imports: [FormStrip, LucideChevronDown, LucideHistory],
  templateUrl: './period-switcher.html',
  host: { class: 'flex min-w-0' },
})
export class PeriodSwitcher {
  private readonly context = inject(ReportContext);
  private readonly router = inject(Router);
  private readonly trigger = viewChild.required<ElementRef<HTMLElement>>('trigger');
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');

  protected readonly periods = computed(() => resourceValue(this.context.periods, null) ?? null);
  protected readonly title = computed(() => periodTitle(this.context.query(), this.periods()));
  /** Option value of the period read; the latest month when the URL names none. */
  protected readonly selected = computed(() => {
    const value = periodOption(this.context.query());
    const latest = this.periods()?.months[0]?.key;
    return value || (latest ? periodOption({ month: latest }) : '');
  });
  /** Month whose sessions are listed, following the pointer and the keyboard. */
  protected readonly preview = signal<string | null>(null);
  protected readonly previewSessions = computed(() => {
    const month = this.periods()?.months.find((m) => m.key === this.preview());
    return (month?.sessions ?? []).map((session) => ({
      session,
      value: periodOption(sessionQuery(session.day)),
      form: sessionForm(session),
    }));
  });
  protected readonly history = computed(() => {
    const periods = this.periods();
    return periods ? { start: periods.firstDay, end: periods.lastDay } : null;
  });

  protected readonly option = periodOption;
  protected readonly monthTitle = monthTitle;
  protected readonly ofMonth = ofMonth;
  protected readonly sessionDay = sessionDay;
  protected readonly winShare = winShare;
  protected readonly freshness = freshness;
  protected readonly integer = integer;
  protected readonly sessionQuery = sessionQuery;

  /** Pins the panel under the title and lists the month being read. */
  protected opening(event: Event): void {
    const periods = this.periods();
    if ((event as ToggleEvent).newState !== 'open' || !periods) {
      return;
    }
    this.preview.set(focusMonth(this.context.query(), periods));
    const placement = placeUnder(
      this.trigger().nativeElement.getBoundingClientRect(),
      remToPx(PERIOD_PANEL_WIDTH_REM),
      { width: window.innerWidth, height: window.innerHeight },
    );
    applyPlacement(this.panel().nativeElement, placement);
  }

  /** Same view, new period. */
  protected choose(query: PeriodQuery): void {
    this.panel().nativeElement.hidePopover();
    const tree = this.router.parseUrl(this.router.url);
    tree.queryParams = periodQueryParams(query);
    void this.router.navigateByUrl(tree);
  }
}
