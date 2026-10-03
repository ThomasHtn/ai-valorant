import { Component, computed, input } from '@angular/core';

import { STATUS_LABELS } from '@core/format/labels.constants';
import { formatValue, integer } from '@core/format/value-format.utils';
import { Finding } from '@core/report/findings.model';
import { Rate } from '@core/report/rate.model';
import { Badge } from '@shared/badge/badge';
import { resolveArt } from '@shared/game-art/art.utils';
import { RowArt } from '@shared/game-art/row-art';
import { RewatchLinks } from '@shared/rewatch-links/rewatch-links';

import { barWidth } from '../findings-view.utils';

/** One bar of the card: who, the rate as text, its count and the bar width. */
interface RateBar {
  label: string;
  value: string;
  sample: string;
  width: number;
  /** Tailwind background class of the bar. */
  fill: string;
  isSquad: boolean;
}

const ONE_DECIMAL = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * A strength or weakness: scope and status, the metric, the rounds at stake, the squad's rate as a
 * bar beside the two fixed references (adversaires, top ranked), and the rounds to rewatch.
 */
@Component({
  selector: 'app-finding-card',
  imports: [Badge, RowArt, RewatchLinks],
  templateUrl: './finding-card.html',
  host: {
    class:
      'grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 bg-text-primary/4 px-3.5 py-3',
  },
})
export class FindingCard {
  public readonly finding = input.required<Finding>();
  public readonly playerAgents = input<Record<string, string>>({});

  protected readonly art = computed(() => resolveArt(this.finding().art, this.playerAgents()));
  protected readonly isWeak = computed(() => this.finding().side === 'weak');
  protected readonly statusLabel = computed(() => STATUS_LABELS[this.finding().status]);
  protected readonly gapText = computed(() => {
    const gap = this.finding().gapRounds;
    return `${gap > 0 ? '+' : gap < 0 ? '−' : ''}${ONE_DECIMAL.format(Math.abs(gap))}`;
  });

  protected readonly bars = computed<RateBar[]>(() => {
    const f = this.finding();
    const bar = (label: string, rate: Rate, fill: string, isSquad = false): RateBar => ({
      label,
      value: formatValue(rate.value, 'pct'),
      sample: `${integer(rate.count)}/${integer(rate.total)}`,
      width: barWidth(rate.value),
      fill,
      isSquad,
    });
    return [
      bar("L'escouade", f.squad, this.isWeak() ? 'bg-rating-bad' : 'bg-rating-good', true),
      bar('Adversaires', f.opp, 'bg-opponent'),
      bar('Top ranked', f.top, 'bg-top'),
    ];
  });
}
