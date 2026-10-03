import { Component, ElementRef, afterRenderEffect, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SIDE_LABELS } from '@core/format/labels.constants';
import { dayMonth } from '@core/format/format.utils';
import { BUY_SENTENCE_LABELS } from '@core/format/round-labels.constants';
import { roundLink, sameRound } from '@core/report/round-ref.utils';
import { RoundLine, RoundRef } from '@core/report/rounds.model';
import { MapThumb } from '@shared/game-art/map-thumb';
import { revealCurrent } from '@shared/scroll/reveal-current.utils';

import { roundOutcome } from './round-list.utils';

/**
 * Rounds kept by the filters, in the list's order; a line opens the round's sheet. The right side
 * names the cause of a lost round and, for a throw, the chance the squad had.
 */
@Component({
  selector: 'app-round-list',
  imports: [MapThumb, RouterLink],
  templateUrl: './round-list.html',
})
export class RoundList {
  public readonly rounds = input.required<readonly RoundLine[]>();
  public readonly selected = input<RoundRef | null>(null);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly lines = computed(() =>
    this.rounds().map((round) => ({
      key: `${round.matchId}_${round.roundNumber}`,
      round,
      link: roundLink(round),
      active: sameRound(round, this.selected()),
      title: `${round.mapName} R${round.roundNumber}`,
      day: dayMonth(round.day),
      ...roundOutcome(round),
      detail: `${SIDE_LABELS[round.side]} · ${BUY_SENTENCE_LABELS[round.buy]} contre ${BUY_SENTENCE_LABELS[round.oppBuy]}`,
    })),
  );

  constructor() {
    // Bring the open round into the list's view without scrolling the page.
    afterRenderEffect(() => {
      this.lines();
      revealCurrent(this.host.nativeElement.querySelector('ul'));
    });
  }
}
