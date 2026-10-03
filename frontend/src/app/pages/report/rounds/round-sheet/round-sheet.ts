import { Component, computed, input, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { longDay } from '@core/format/format.utils';
import { LOSS_CAUSE_LABELS } from '@core/format/labels.constants';
import { BUY_SENTENCE_LABELS, RESULT_LABELS } from '@core/format/round-labels.constants';
import { formatValue } from '@core/format/value-format.utils';
import { RoundSheet } from '@core/report/rounds.model';
import { Badge } from '@shared/badge/badge';
import { InfoTip } from '@shared/info-tip/info-tip';

import { EconomyTable } from '../economy-table/economy-table';
import { EventTimeline } from '../event-timeline/event-timeline';
import { Replay2d } from '../replay-2d/replay-2d';
import { clampStep } from '../replay-2d/replay-2d.utils';
import { WinProbabilityChart } from '../win-probability-chart/win-probability-chart';

/**
 * Sheet of one round: key facts, the win probability over time, the 2D replay and the timeline
 * (all three follow the selected event), then both teams' economy.
 */
@Component({
  selector: 'app-round-sheet',
  imports: [Badge, EconomyTable, EventTimeline, InfoTip, Replay2d, RouterLink, WinProbabilityChart],
  templateUrl: './round-sheet.html',
  host: { class: 'flex min-w-0 flex-col gap-10' },
})
export class RoundSheetView {
  public readonly sheet = input.required<RoundSheet>();

  /** Selected event; back to the first one when another round opens. */
  protected readonly step = linkedSignal({ source: this.sheet, computation: () => 0 });

  protected readonly round = computed(() => this.sheet().round);
  protected readonly facts = computed(() => {
    const round = this.round();
    return {
      day: longDay(round.day),
      buys: `${BUY_SENTENCE_LABELS[round.buy]} contre ${BUY_SENTENCE_LABELS[round.oppBuy]}`,
      result: RESULT_LABELS[round.result] ?? round.result,
      lead: `Avantage max ${round.maxAdvantage > 0 ? '+' : ''}${round.maxAdvantage}`,
      chance: formatValue(round.bestProbability, 'pct'),
      cause: round.cause ? LOSS_CAUSE_LABELS[round.cause] : round.won ? '—' : 'Duels perdus',
    };
  });

  protected select(step: number): void {
    this.step.set(clampStep(step, this.sheet().events.length));
  }
}
