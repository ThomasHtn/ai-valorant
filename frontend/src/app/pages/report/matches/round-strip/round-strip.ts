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
  /** Score gap after the round (+2 when leading by two), drawn as a bar over the square. */
  gap: number;
  /** Bar height as a share of the half bar area, 0..1. */
  reach: number;
}

/**
 * One square per round, green won and red lost, with the side and the buy; a gap marks each side
 * swap. Over each square a bar shows the score gap after the round, so the match's momentum
 * (comebacks, leads thrown) reads along the rounds. A square opens the round's sheet, its list
 * limited to the match with won rounds included.
 */
@Component({
  selector: 'app-round-strip',
  imports: [RouterLink, HoverTip],
  templateUrl: './round-strip.html',
})
export class RoundStrip {
  public readonly matchId = input.required<string>();
  public readonly rounds = input.required<readonly RoundStripCell[]>();

  protected readonly items = computed<StripView[]>(() => {
    const gaps = scoreGaps(this.rounds());
    const widest = Math.max(1, ...gaps.map(Math.abs));
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
          gap: 0,
          reach: 0,
        };
      }
      const gap = gaps[index++];
      return {
        key: `r${item.cell.roundNumber}`,
        swap: false,
        cell: item.cell,
        tip: roundTip(item.cell, gap),
        link: roundLink({ matchId: this.matchId(), roundNumber: item.cell.roundNumber }),
        buy: BUY_SHORT_LABELS[item.cell.buy],
        gap,
        reach: Math.abs(gap) / widest,
      };
    });
  });
}
