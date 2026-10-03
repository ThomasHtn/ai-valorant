import { Component, computed, input, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { longDay } from '@core/format/format.utils';
import { BUY_SENTENCE_LABELS } from '@core/format/round-labels.constants';
import { RoundSheet } from '@core/report/rounds.model';
import { Badge } from '@shared/badge/badge';
import { InfoTip } from '@shared/info-tip/info-tip';

import { EconomyTable } from '../economy-table/economy-table';
import { EventTimeline } from '../event-timeline/event-timeline';
import { Replay2d } from '../replay-2d/replay-2d';
import { clampStep } from '../replay-2d/replay-2d.utils';
import { keyMoment } from '../round-moments.utils';
import { WinProbabilityChart } from '../win-probability-chart/win-probability-chart';
import { roundSummary } from './round-sheet.utils';

/**
 * Sheet of one round: what happened in a few sentences, the win probability over time, the 2D replay
 * and the timeline (all three follow the selected event), then both teams' economy.
 */
@Component({
  selector: 'app-round-sheet',
  imports: [Badge, EconomyTable, EventTimeline, InfoTip, Replay2d, RouterLink, WinProbabilityChart],
  templateUrl: './round-sheet.html',
  host: { class: 'flex min-w-0 flex-col gap-8' },
})
export class RoundSheetView {
  public readonly sheet = input.required<RoundSheet>();

  /** Selected event; back to the first one when another round opens. */
  protected readonly step = linkedSignal({ source: this.sheet, computation: () => 0 });

  protected readonly round = computed(() => this.sheet().round);
  protected readonly key = computed(() => keyMoment(this.sheet().events, this.round().won));
  protected readonly summary = computed(() =>
    roundSummary(this.round(), this.sheet().events, this.key()),
  );
  protected readonly context = computed(() => {
    const round = this.round();
    return {
      day: longDay(round.day),
      buys: `${BUY_SENTENCE_LABELS[round.buy]} contre ${BUY_SENTENCE_LABELS[round.oppBuy]}`,
    };
  });

  protected select(step: number): void {
    this.step.set(clampStep(step, this.sheet().events.length));
  }
}
