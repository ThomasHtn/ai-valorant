import { Component, computed, inject } from '@angular/core';

import { resourceValue } from '@core/http/resource-state.utils';
import { ReportApi } from '@core/report/report-api';
import { ReportContext } from '@core/report/report-context';
import { ResourceState } from '@shared/resource-state/resource-state';

import { roundsByMatch } from './matches.utils';
import { SessionGrid } from './session-grid/session-grid';

/**
 * Matchs: every session of the period (a session period shows only its own), one line per match.
 * A line opens the match on its first round.
 */
@Component({
  selector: 'app-matches-view',
  imports: [ResourceState, SessionGrid],
  host: { class: 'view-body' },
  templateUrl: './matches-view.html',
})
export class MatchesView {
  private readonly context = inject(ReportContext);
  private readonly api = inject(ReportApi);

  protected readonly list = this.api.matches(this.context.query);
  /** Rounds of the period: the halves and the fact of each line. */
  private readonly roundIndex = this.api.rounds(this.context.query);
  protected readonly roundsMap = computed(() =>
    roundsByMatch(resourceValue(this.roundIndex, null)?.rounds ?? []),
  );
}
