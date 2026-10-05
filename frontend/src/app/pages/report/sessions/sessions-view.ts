import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { resourceValue } from '@core/http/resource-state.utils';
import { ReportApi } from '@core/report/report-api';
import { ReportContext } from '@core/report/report-context';
import { ColHead } from '@shared/col-head/col-head';
import { AgentIcon } from '@shared/game-art/agent-icon';
import { MapThumb } from '@shared/game-art/map-thumb';
import { GapBar } from '@shared/gap-bar/gap-bar';
import { BAR_TEXTS } from '@shared/gap-bar/gap-bar.constants';
import { ResourceState } from '@shared/resource-state/resource-state';

import { sessionRows } from './sessions.utils';

/**
 * Sessions of the period, newest first: the matches played back to back, each summed up in one line.
 * A line opens the session, a match of the session opens its rounds.
 */
@Component({
  selector: 'app-sessions-view',
  imports: [AgentIcon, ColHead, GapBar, MapThumb, ResourceState],
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

  protected open(day: string): void {
    void this.router.navigate(['/report/sessions', day], { queryParamsHandling: 'preserve' });
  }
}
