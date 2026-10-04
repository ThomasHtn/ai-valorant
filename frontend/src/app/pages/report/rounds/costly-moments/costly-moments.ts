import { Component, computed, input, output } from '@angular/core';

import { RoundLine } from '@core/report/rounds.model';

import { CostlyMoment } from '../rounds-overview.model';
import { costlyMoments } from '../rounds-overview.utils';

/**
 * Moments of a match that decide rounds (pistols, the round after, the bonus round, losing streaks,
 * throws), each one a line that lists its rounds below when clicked.
 */
@Component({
  selector: 'app-costly-moments',
  templateUrl: './costly-moments.html',
  host: { class: 'view-section' },
})
export class CostlyMoments {
  public readonly rounds = input.required<readonly RoundLine[]>();
  /** Moment whose rounds the list shows, highlighted. */
  public readonly selected = input<CostlyMoment['key'] | null>(null);
  public readonly picked = output<CostlyMoment['key']>();

  protected readonly moments = computed(() => costlyMoments(this.rounds()));
}
