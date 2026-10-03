import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { RoundStripCell } from '@core/report/matches.model';
import { InfoTip } from '@shared/info-tip/info-tip';

import { LostRoundRow, lossCauseCounts } from '../matches.utils';

/**
 * Lost rounds of a match: how many per cause, then each one with its cause and, for a throw, the
 * chance the squad had. A line opens the round's sheet in Rounds, its list limited to the match.
 */
@Component({
  selector: 'app-lost-rounds',
  imports: [InfoTip, RouterLink],
  templateUrl: './lost-rounds.html',
  host: {
    class: 'view-section',
    role: 'region',
    'aria-labelledby': 'lost-rounds-title',
  },
})
export class LostRounds {
  public readonly matchId = input.required<string>();
  /** Every round of the match, for the counts by cause. */
  public readonly rounds = input.required<readonly RoundStripCell[]>();
  /** Lost rounds with their chance, empty while the rounds of the period load. */
  public readonly rows = input.required<readonly LostRoundRow[]>();

  protected readonly causes = computed(() => lossCauseCounts(this.rounds()));
  protected readonly lost = computed(() => this.rounds().filter((r) => !r.won).length);
}
