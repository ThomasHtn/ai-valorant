import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideChevronLeft, LucideChevronRight } from '@lucide/angular';

import { longDay } from '@core/format/format.utils';
import { resourceValue } from '@core/http/resource-state.utils';
import { ReportApi } from '@core/report/report-api';
import { ReportContext } from '@core/report/report-context';
import { Breadcrumb } from '@shared/breadcrumb/breadcrumb';
import { Crumb } from '@shared/breadcrumb/breadcrumb.model';
import { InfoTip } from '@shared/info-tip/info-tip';
import { ResourceState } from '@shared/resource-state/resource-state';

import { LostRounds } from './lost-rounds/lost-rounds';
import { MatchHeader } from './match-header/match-header';
import { lostRoundRows, matchNeighbours, roundsByMatch } from './matches.utils';
import { RoundStrip } from './round-strip/round-strip';
import { Scoreboard } from './scoreboard/scoreboard';
import { SessionGrid } from './session-grid/session-grid';

/**
 * Matchs: without a match, every session of the period as match cards (an evening opened from the
 * home page shows only its own). With one, the match alone under a breadcrumb, with the matches
 * played before and after it: banner, round strip, its lost rounds to rewatch, both scoreboards.
 */
@Component({
  selector: 'app-matches-view',
  imports: [
    RouterLink,
    LucideChevronLeft,
    LucideChevronRight,
    Breadcrumb,
    InfoTip,
    LostRounds,
    MatchHeader,
    ResourceState,
    RoundStrip,
    Scoreboard,
    SessionGrid,
  ],
  host: { class: 'view-body' },
  templateUrl: './matches-view.html',
})
export class MatchesView {
  /** Route parameter: the open match; the sessions of the period without it. */
  public readonly match = input<string>();

  protected readonly context = inject(ReportContext);
  private readonly api = inject(ReportApi);

  protected readonly list = this.api.matches(this.context.query);
  protected readonly selectedId = computed(() => this.match() ?? null);
  protected readonly detail = this.api.match(this.selectedId);
  /** Rounds of the period: mini strips of the cards, and the chance each lost round had. */
  private readonly roundIndex = this.api.rounds(this.context.query);
  private readonly periodRounds = computed(
    () => resourceValue(this.roundIndex, null)?.rounds ?? [],
  );

  protected readonly roundsMap = computed(() => roundsByMatch(this.periodRounds()));
  protected readonly lostRows = computed(() =>
    lostRoundRows(this.periodRounds(), this.selectedId() ?? ''),
  );
  protected readonly neighbours = computed(() =>
    matchNeighbours(resourceValue(this.list, null), this.selectedId() ?? ''),
  );
  protected readonly crumbs = computed<Crumb[]>(() => {
    const match = resourceValue(this.detail, null);
    return [
      { label: 'Matchs', link: ['/report/matches'] },
      ...(match
        ? [
            { label: longDay(match.day), link: null },
            { label: `${match.mapName} ${match.roundsWon}-${match.roundsLost}`, link: null },
          ]
        : []),
    ];
  });
  protected readonly longDay = longDay;
}
