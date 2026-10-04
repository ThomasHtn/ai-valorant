import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BUY_SHORT_LABELS } from '@core/format/round-labels.constants';
import { RoundStripCell } from '@core/report/matches.model';
import { roundLink } from '@core/report/round-ref.utils';
import { HoverTip } from '@shared/hover-tip/hover-tip';
import { HoverTipContent } from '@shared/hover-tip/hover-tip.model';

import { roundTip, scoreGaps, stripItems } from '../matches.utils';

/** A round square ready to draw: its tip and its link are built once per match. */
interface StripView {
  key: string;
  swap: boolean;
  cell: RoundStripCell | null;
  tip: HoverTipContent | null;
  link: string[] | null;
  buy: string;
}

/**
 * One square per round, green won and red lost, with the side and the buy; a gap marks each side
 * swap. Its tip gives the score after the round. A square opens the round's page under the match,
 * so on that page the strip is also the way to the other rounds.
 */
@Component({
  selector: 'app-round-strip',
  imports: [RouterLink, HoverTip],
  templateUrl: './round-strip.html',
})
export class RoundStrip {
  public readonly matchId = input.required<string>();
  public readonly rounds = input.required<readonly RoundStripCell[]>();
  /** Round whose page is open, drawn raised with an amber frame; null on the match page. */
  public readonly current = input<number | null>(null);

  protected readonly items = computed<StripView[]>(() => {
    const gaps = scoreGaps(this.rounds());
    let index = 0;
    return stripItems(this.rounds()).map((item) => {
      if (item.kind === 'swap') {
        return {
          key: item.key,
          swap: true,
          cell: null,
          tip: null,
          link: null,
          buy: '',
        };
      }
      return {
        key: `r${item.cell.roundNumber}`,
        swap: false,
        cell: item.cell,
        tip: roundTip(item.cell, gaps[index++]),
        link: roundLink({ matchId: this.matchId(), roundNumber: item.cell.roundNumber }),
        buy: BUY_SHORT_LABELS[item.cell.buy],
      };
    });
  });
}
