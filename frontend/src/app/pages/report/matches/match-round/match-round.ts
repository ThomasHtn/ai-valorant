import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideChevronLeft, LucideChevronRight } from '@lucide/angular';

import { resourceValue } from '@core/http/resource-state.utils';
import { ReportApi } from '@core/report/report-api';
import { roundLink } from '@core/report/round-ref.utils';
import { Breadcrumb } from '@shared/breadcrumb/breadcrumb';
import { ResourceState } from '@shared/resource-state/resource-state';

import { RoundStrip } from '../round-strip/round-strip';
import { RoundSheetView } from './round-sheet/round-sheet';
import { roundCrumbs, roundNeighbours } from './match-round.utils';

/**
 * One round of a match on its own page: the breadcrumb back to the match, the match's round strip
 * as a picker (the open round framed in amber), then the round's sheet.
 */
@Component({
  selector: 'app-match-round',
  imports: [
    Breadcrumb,
    LucideChevronLeft,
    LucideChevronRight,
    ResourceState,
    RoundSheetView,
    RoundStrip,
    RouterLink,
  ],
  templateUrl: './match-round.html',
  host: { class: 'view-body' },
})
export class MatchRound {
  /** Route parameters: the match id and the 1-based round number. */
  public readonly match = input.required<string>();
  public readonly round = input.required<string>();

  private readonly api = inject(ReportApi);

  protected readonly roundNumber = computed(() => Number(this.round()) || 1);
  protected readonly detail = this.api.match(this.match);
  protected readonly sheet = this.api.roundSheet(
    computed(() => ({ matchId: this.match(), roundNumber: this.roundNumber() })),
  );
  protected readonly crumbs = computed(() =>
    roundCrumbs(resourceValue(this.detail, null) ?? null, this.roundNumber()),
  );
  /** Links of the rounds before and after this one; null at either end of the match. */
  protected readonly neighbours = computed(() => {
    const count = resourceValue(this.detail, null)?.rounds.length ?? 0;
    const { previous, next } = roundNeighbours(this.roundNumber(), count);
    const link = (n: number | null) =>
      n === null ? null : { number: n, link: roundLink({ matchId: this.match(), roundNumber: n }) };
    return { previous: link(previous), next: link(next) };
  });
}
