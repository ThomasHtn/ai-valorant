import { Component, computed, inject } from '@angular/core';
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

import { fullDate, longDay } from '@core/format/format.utils';
import { resourceValue } from '@core/http/resource-state.utils';
import { PeriodsApi } from '@core/periods/periods-api';
import { SessionsApi } from '@core/sessions/sessions-api';
import { PageHeader } from '@layout/page-header/page-header';
import { Badge } from '@shared/badge/badge';
import { MapName } from '@shared/game-art/map-name';
import { ResourceState } from '@shared/resource-state/resource-state';

import { monthGroups } from './home.utils';

/** Every report as a tree: months holding their report and evenings, then patches. */
@Component({
  selector: 'app-home',
  imports: [
    RouterLink,
    PageHeader,
    Badge,
    MapName,
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
  private readonly sessions = inject(SessionsApi).list;
  protected readonly periods = inject(PeriodsApi).available;

  protected readonly groups = computed(() =>
    monthGroups(
      resourceValue(this.periods, null)?.months ?? [],
      resourceValue(this.sessions, null) ?? [],
    ),
  );

  protected readonly fullDate = fullDate;
  protected readonly longDay = longDay;
}
