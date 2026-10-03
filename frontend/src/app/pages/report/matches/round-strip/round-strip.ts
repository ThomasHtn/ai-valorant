import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BUY_SHORT_LABELS } from '@core/format/round-labels.constants';
import { RoundStripCell } from '@core/report/matches.model';
import { roundLink } from '@core/report/round-ref.utils';
import { HoverTip } from '@shared/hover-tip/hover-tip';
import { HoverTipContent } from '@shared/hover-tip/hover-tip.model';

import { roundTip, stripItems } from '../matches.utils';

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
 * swap. A square opens the round's sheet.
 */
@Component({
  selector: 'app-round-strip',
  imports: [RouterLink, HoverTip],
  templateUrl: './round-strip.html',
})
export class RoundStrip {
  public readonly matchId = input.required<string>();
  public readonly rounds = input.required<readonly RoundStripCell[]>();

  protected readonly items = computed<StripView[]>(() =>
    stripItems(this.rounds()).map((item) =>
      item.kind === 'swap'
        ? { key: item.key, swap: true, cell: null, tip: null, link: null, buy: '' }
        : {
            key: `r${item.cell.roundNumber}`,
            swap: false,
            cell: item.cell,
            tip: roundTip(item.cell),
            link: roundLink({ matchId: this.matchId(), roundNumber: item.cell.roundNumber }),
            buy: BUY_SHORT_LABELS[item.cell.buy],
          },
    ),
  );
}
