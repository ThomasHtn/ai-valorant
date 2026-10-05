import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LucideCalendar, LucideChartColumn } from '@lucide/angular';

import { resourceValue } from '@core/http/resource-state.utils';
import { ReportApi } from '@core/report/report-api';
import { ReportContext } from '@core/report/report-context';
import { ColHead } from '@shared/col-head/col-head';
import { AgentIcon } from '@shared/game-art/agent-icon';
import { MapThumb } from '@shared/game-art/map-thumb';
import { GapBar } from '@shared/gap-bar/gap-bar';
import { BAR_TEXTS } from '@shared/gap-bar/gap-bar.constants';
import { ResourceState } from '@shared/resource-state/resource-state';
import { ColumnChart } from '@shared/column-chart/column-chart';
import { ChartColumn } from '@shared/column-chart/column-chart.model';
import { SectionHead } from '@shared/section-head/section-head';

import { sessionRows } from './sessions.utils';

/**
 * Sessions of the period, newest first: the matches played back to back, each summed up in one line.
 * A line opens the session, a match of the session opens its rounds.
 */
@Component({
  selector: 'app-sessions-view',
  imports: [
    AgentIcon,
    ColHead,
    ColumnChart,
    GapBar,
    LucideCalendar,
    LucideChartColumn,
    MapThumb,
    ResourceState,
    SectionHead,
  ],
  templateUrl: './sessions-view.html',
  host: { class: 'view-body' },
})
export class SessionsView {
  protected readonly context = inject(ReportContext);
  private readonly api = inject(ReportApi);
  private readonly router = inject(Router);

  protected readonly list = this.api.matches(this.context.query);
  private readonly rounds = this.api.rounds(this.context.query);
  private readonly pool = computed(
    () => new Set(resourceValue(this.context.meta, null)?.mapPool ?? []),
  );
  protected readonly rows = computed(() =>
    sessionRows(
      resourceValue(this.list, null)?.evenings ?? [],
      resourceValue(this.rounds, null)?.rounds ?? [],
      this.pool(),
    ),
  );
  protected readonly tones = BAR_TEXTS;
  /** The period session by session, oldest on the left. */
  protected readonly columns = computed<ChartColumn[]>(() =>
    [...this.rows()].reverse().map((r) => ({
      key: r.day,
      label: r.label.replace(/\.$/, ''),
      value: r.rounds.rate,
      text: r.rounds.text,
      tone: r.rounds.tone === 'small' ? 'small' : r.winning ? 'good' : 'bad',
      title: `${r.label} : ${r.record}, ${r.rounds.text} de rounds gagnés`,
    })),
  );
  protected readonly summary = computed(() => {
    const rows = this.rows();
    const won = rows.filter((r) => r.winning).length;
    return rows.length ? `${won} sessions gagnantes sur ${rows.length}` : null;
  });

  protected open(day: string): void {
    void this.router.navigate(['/report/sessions', day], { queryParamsHandling: 'preserve' });
  }
}
