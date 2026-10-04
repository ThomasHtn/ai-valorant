import { Component, computed, input, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SIDE_LABELS } from '@core/format/labels.constants';
import { dayMonth, THROW_TIP } from '@core/format/format.utils';
import { BUY_SENTENCE_LABELS } from '@core/format/round-labels.constants';
import { roundLink } from '@core/report/round-ref.utils';
import { RoundLine } from '@core/report/rounds.model';
import { MapThumb } from '@shared/game-art/map-thumb';
import { HoverTip } from '@shared/hover-tip/hover-tip';
import { HoverTipContent } from '@shared/hover-tip/hover-tip.model';

import { ROUND_LIST_PAGE } from './round-list.constants';
import { roundOutcome } from './round-list.utils';

/**
 * Rounds kept by the filters as a compact table, a page at a time; a row opens the round's page
 * under its match. The last column names the cause of a lost round and, for a throw, the chance
 * the squad had.
 */
@Component({
  selector: 'app-round-list',
  imports: [HoverTip, MapThumb, RouterLink],
  templateUrl: './round-list.html',
})
export class RoundList {
  public readonly rounds = input.required<readonly RoundLine[]>();

  /** Rows shown; back to one page when the filters change. */
  protected readonly shown = linkedSignal({
    source: this.rounds,
    computation: () => ROUND_LIST_PAGE,
  });
  protected readonly throwTip: HoverTipContent = { title: 'Throw', text: THROW_TIP };
  protected readonly lines = computed(() =>
    this.rounds()
      .slice(0, this.shown())
      .map((round) => ({
        key: `${round.matchId}_${round.roundNumber}`,
        round,
        link: roundLink(round),
        day: dayMonth(round.day),
        side: SIDE_LABELS[round.side],
        buys: `${BUY_SENTENCE_LABELS[round.buy]} contre ${BUY_SENTENCE_LABELS[round.oppBuy]}`,
        ...roundOutcome(round),
      })),
  );
  protected readonly remaining = computed(() => this.rounds().length - this.lines().length);

  protected more(): void {
    this.shown.update((n) => n + ROUND_LIST_PAGE);
  }
}
