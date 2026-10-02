import { Component, computed, input } from '@angular/core';

import { percent } from '@core/format/format.utils';
import { Economy } from '@core/periods/team.model';
import { RATING_COLOR_VARIABLE, RATING_TEXT_CLASS } from '@core/rating/rating.constants';
import { Rating } from '@core/rating/rating.model';
import { InfoTip } from '@shared/info-tip/info-tip';
import { TargetBar } from '@shared/target-bar/target-bar';

import { buyResultGroups } from './buy-results.utils';

/**
 * Rounds won by buy, pistols first: each line shows the squad's rate as a bar with a tick at the
 * top ranked's, then the gap and how many rounds it is built on.
 */
@Component({
  selector: 'app-buy-results',
  imports: [InfoTip, TargetBar],
  templateUrl: './buy-results.html',
  host: { class: 'block' },
})
export class BuyResults {
  public readonly economy = input.required<Economy>();

  protected readonly groups = computed(() => buyResultGroups(this.economy()));
  protected readonly percent = percent;

  protected textClass(rating: Rating): string {
    return RATING_TEXT_CLASS[rating];
  }

  /** Left edge of a line, in the colour of its reading. */
  protected accent(rating: Rating): string | null {
    return rating === 'unknown' ? null : `var(${RATING_COLOR_VARIABLE[rating]})`;
  }
}
