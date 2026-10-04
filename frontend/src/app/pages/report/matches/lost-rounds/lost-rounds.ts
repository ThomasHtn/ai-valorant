import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { THROW_TIP } from '@core/format/format.utils';
import { RoundStripCell } from '@core/report/matches.model';
import { HoverTip } from '@shared/hover-tip/hover-tip';
import { HoverTipContent } from '@shared/hover-tip/hover-tip.model';
import { InfoTip } from '@shared/info-tip/info-tip';

import { LostRoundRow, lossCauseCounts } from '../matches.utils';

/**
 * Lost rounds of a match: how many per cause, then each one with its cause and, for a throw, the
 * chance the squad had. A line opens the round on the match page.
 */
@Component({
  selector: 'app-lost-rounds',
  imports: [HoverTip, InfoTip, RouterLink],
  templateUrl: './lost-rounds.html',
  host: {
    class: 'view-section',
    role: 'region',
    'aria-labelledby': 'lost-rounds-title',
  },
})
export class LostRounds {
  /** Every round of the match, for the counts by cause. */
  public readonly rounds = input.required<readonly RoundStripCell[]>();
  /** Lost rounds with their chance, empty while the rounds of the period load. */
  public readonly rows = input.required<readonly LostRoundRow[]>();

  protected readonly throwTip: HoverTipContent = { title: 'Throw', text: THROW_TIP };
  protected readonly causes = computed(() => lossCauseCounts(this.rounds()));
  protected readonly lost = computed(() => this.rounds().filter((r) => !r.won).length);
}
