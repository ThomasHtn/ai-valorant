import { Component, computed, inject, input } from '@angular/core';

import { resourceValue } from '@core/http/resource-state.utils';
import { ReportApi } from '@core/report/report-api';
import { ReportContext } from '@core/report/report-context';
import { InfoTip } from '@shared/info-tip/info-tip';
import { ResourceState } from '@shared/resource-state/resource-state';

import { EveningList } from './evening-list/evening-list';
import { LostRounds } from './lost-rounds/lost-rounds';
import { MatchHeader } from './match-header/match-header';
import { defaultMatchId, lostRoundRows } from './matches.utils';
import { RoundStrip } from './round-strip/round-strip';
import { Scoreboard } from './scoreboard/scoreboard';

/**
 * Matchs: the matches of the period grouped by evening (an evening opened from the home page shows
 * only its own), then one match: banner, round strip, its lost rounds to rewatch, both scoreboards.
 */
@Component({
  selector: 'app-matches-view',
  imports: [EveningList, InfoTip, LostRounds, MatchHeader, ResourceState, RoundStrip, Scoreboard],
  host: { class: 'view-body' },
  templateUrl: './matches-view.html',
})
export class MatchesView {
  /** Route parameter: the open match; the latest one of the period without it. */
  public readonly match = input<string>();

  protected readonly context = inject(ReportContext);
  private readonly api = inject(ReportApi);

  protected readonly list = this.api.matches(this.context.query);
  protected readonly selectedId = computed(
    () => this.match() ?? defaultMatchId(resourceValue(this.list, null)),
  );
  protected readonly detail = this.api.match(this.selectedId);
  /** Rounds of the period, for the chance each lost round of the match had. */
  private readonly roundIndex = this.api.rounds(this.context.query);
  protected readonly lostRows = computed(() =>
    lostRoundRows(resourceValue(this.roundIndex, null)?.rounds ?? [], this.selectedId() ?? ''),
  );
}
