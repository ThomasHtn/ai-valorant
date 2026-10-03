import { Component, computed, inject, input } from '@angular/core';

import { resourceValue } from '@core/http/resource-state.utils';
import { ReportApi } from '@core/report/report-api';
import { ReportContext } from '@core/report/report-context';
import { InfoTip } from '@shared/info-tip/info-tip';
import { ResourceState } from '@shared/resource-state/resource-state';

import { EveningList } from './evening-list/evening-list';
import { LossCauses } from './loss-causes/loss-causes';
import { MatchHeader } from './match-header/match-header';
import { defaultMatchId } from './matches.utils';
import { RoundStrip } from './round-strip/round-strip';
import { Scoreboard } from './scoreboard/scoreboard';

/**
 * Matchs: the matches of the period grouped by evening (an evening opened from the home page shows
 * only its own), then one match: banner, round strip, both scoreboards, lost rounds by cause.
 */
@Component({
  selector: 'app-matches-view',
  imports: [EveningList, InfoTip, LossCauses, MatchHeader, ResourceState, RoundStrip, Scoreboard],
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
}
