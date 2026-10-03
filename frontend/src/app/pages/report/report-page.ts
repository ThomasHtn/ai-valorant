import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { freshness } from '@core/format/format.utils';
import { integer } from '@core/format/value-format.utils';
import { ReportContext } from '@core/report/report-context';
import { REPORT_VIEWS } from '@core/report/report-views.constants';
import { PageHeader } from '@layout/page-header/page-header';
import { DataQuality } from '@shared/data-quality/data-quality';
import { ResourceState } from '@shared/resource-state/resource-state';

import { PeriodSelector } from './period-selector/period-selector';

/**
 * Frame of every report view: the period as a title, its facts, and the view tabs (ValoQuests
 * overview tabs). The period stays in the URL's query when moving between views.
 */
@Component({
  selector: 'app-report-page',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
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
  protected readonly views = REPORT_VIEWS;
  protected readonly integer = integer;
  protected readonly freshness = freshness;
}
