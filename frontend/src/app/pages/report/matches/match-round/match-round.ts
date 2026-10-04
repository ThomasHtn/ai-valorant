import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideChevronLeft, LucideChevronRight } from '@lucide/angular';

import { resourceValue } from '@core/http/resource-state.utils';
import { ReportApi } from '@core/report/report-api';
import { ReportContext } from '@core/report/report-context';
import { roundLink } from '@core/report/round-ref.utils';
import { RoundSheet } from '@core/report/rounds.model';
import { Breadcrumb } from '@shared/breadcrumb/breadcrumb';
import { InfoTip } from '@shared/info-tip/info-tip';
import { ResourceState } from '@shared/resource-state/resource-state';

import { LostRounds } from '../lost-rounds/lost-rounds';
import { MatchHeader } from '../match-header/match-header';
import { lostRoundRows, matchNeighbours } from '../matches.utils';
import { RoundStrip } from '../round-strip/round-strip';
import { Scoreboard } from '../scoreboard/scoreboard';
import { RoundSheetView } from './round-sheet/round-sheet';
import { matchCrumbs, roundNeighbours } from './match-round.utils';

/**
 * A match with one of its rounds always open: thin banner, the round strip as picker, the open
 * round (weapons, outcome, chances, replay, timeline), then the lost rounds and both scoreboards.
 * `/report/matches/<id>` lands here on round 1; changing round only swaps the round's part.
 */
@Component({
  selector: 'app-match-round',
  imports: [
    Breadcrumb,
    InfoTip,
    LostRounds,
    LucideChevronLeft,
    LucideChevronRight,
    MatchHeader,
    ResourceState,
    RoundSheetView,
    RoundStrip,
    RouterLink,
    Scoreboard,
  ],
  templateUrl: './match-round.html',
  host: { class: 'flex min-w-0 flex-col gap-4' },
})
export class MatchRound {
  /** Route parameters: the match id and the 1-based round number. */
  public readonly match = input.required<string>();
  public readonly round = input.required<string>();

  private readonly api = inject(ReportApi);
  private readonly context = inject(ReportContext);

  protected readonly roundNumber = computed(() => Number(this.round()) || 1);
  protected readonly detail = this.api.match(this.match);
  protected readonly sheet = this.api.roundSheet(
    computed(() => ({ matchId: this.match(), roundNumber: this.roundNumber() })),
  );
  /** Last loaded sheet, kept while the next round loads. */
  protected readonly shownSheet = linkedSignal<RoundSheet | null, RoundSheet | null>({
    source: () => resourceValue(this.sheet, null) ?? null,
    computation: (value, previous) => value ?? previous?.value ?? null,
  });

  private readonly list = this.api.matches(this.context.query);
  /** Rounds of the period: the chance each lost round of this match had. */
  private readonly periodRounds = this.api.rounds(this.context.query);

  protected readonly crumbs = computed(() => matchCrumbs(resourceValue(this.detail, null) ?? null));
  protected readonly matchNeighbours = computed(() =>
    matchNeighbours(resourceValue(this.list, null), this.match()),
  );
  protected readonly lostRows = computed(() =>
    lostRoundRows(resourceValue(this.periodRounds, null)?.rounds ?? [], this.match()),
  );
  /** Links of the rounds before and after the open one; null at either end of the match. */
  protected readonly roundNeighbours = computed(() => {
    const count = resourceValue(this.detail, null)?.rounds.length ?? 0;
    const { previous, next } = roundNeighbours(this.roundNumber(), count);
    const link = (n: number | null) =>
      n === null ? null : { number: n, link: roundLink({ matchId: this.match(), roundNumber: n }) };
    return { previous: link(previous), next: link(next) };
  });
}
