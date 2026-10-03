import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SIDE_LABELS, LOSS_CAUSE_LABELS } from '@core/format/labels.constants';
import { dayMonth } from '@core/format/format.utils';
import { BUY_SENTENCE_LABELS } from '@core/format/round-labels.constants';
import { roundLink, sameRound } from '@core/report/round-ref.utils';
import { RoundLine, RoundRef } from '@core/report/rounds.model';
import { MapThumb } from '@shared/game-art/map-thumb';

/** Rounds kept by the filters, newest first; a line opens the round's sheet. */
@Component({
  selector: 'app-round-list',
  imports: [MapThumb, RouterLink],
  templateUrl: './round-list.html',
})
export class RoundList {
  public readonly rounds = input.required<readonly RoundLine[]>();
  public readonly selected = input<RoundRef | null>(null);

  protected readonly lines = computed(() =>
    this.rounds().map((round) => ({
      key: `${round.matchId}_${round.roundNumber}`,
      round,
      link: roundLink(round),
      active: sameRound(round, this.selected()),
      title: `${round.mapName} R${round.roundNumber}`,
      day: dayMonth(round.day),
      detail: [
        SIDE_LABELS[round.side],
        `${BUY_SENTENCE_LABELS[round.buy]} contre ${BUY_SENTENCE_LABELS[round.oppBuy]}`,
        round.cause ? LOSS_CAUSE_LABELS[round.cause] : round.won ? 'gagné' : null,
      ]
        .filter(Boolean)
        .join(' · '),
    })),
  );
}
