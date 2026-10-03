import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideCalendarDays,
  LucideChevronDown,
  LucideChevronRight,
  LucideFileChartColumn,
  LucideFolder,
  LucideFolderOpen,
  LucideHistory,
  LucideTag,
} from '@lucide/angular';

import { freshness, longDay, monthTitle } from '@core/format/format.utils';
import { integer } from '@core/format/value-format.utils';
import { ReportApi } from '@core/report/report-api';
import { PageHeader } from '@layout/page-header/page-header';
import { Badge } from '@shared/badge/badge';
import { MapName } from '@shared/game-art/map-name';
import { InfoTip } from '@shared/info-tip/info-tip';
import { ResourceState } from '@shared/resource-state/resource-state';

/**
 * Home: every report as a tree. Months hold their report and their evenings (an evening opens on
 * its matches), then patches and the whole history. Never shows the report's view tabs.
 */
@Component({
  selector: 'app-home',
  imports: [
    RouterLink,
    PageHeader,
    Badge,
    MapName,
    InfoTip,
    ResourceState,
    LucideCalendarDays,
    LucideChevronDown,
    LucideChevronRight,
    LucideFileChartColumn,
    LucideFolder,
    LucideFolderOpen,
    LucideHistory,
    LucideTag,
  ],
  host: { class: 'page-stack' },
  templateUrl: './home.html',
})
export class Home {
  protected readonly periods = inject(ReportApi).periods;

  protected readonly freshness = freshness;
  protected readonly longDay = longDay;
  protected readonly monthTitle = monthTitle;
  protected readonly integer = integer;
}
