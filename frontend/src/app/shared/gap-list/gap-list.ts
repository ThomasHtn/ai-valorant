import { Component, computed, input } from '@angular/core';

import { percent } from '@core/format/format.utils';
import { HelpTopic } from '@core/help/stat-help.constants';
import { RATING_COLOR_VARIABLE, RATING_TEXT_CLASS } from '@core/rating/rating.constants';
import { Rating } from '@core/rating/rating.model';
import { InfoTip } from '@shared/info-tip/info-tip';
import { TargetBar } from '@shared/target-bar/target-bar';

import { GapLine } from './gap-list.model';
import { gapLabel, gapRows } from './gap-list.utils';

/**
 * Situations as lines, the costliest first: the squad's rate with its real count, a bar with a
 * tick at the reference, then the gap counted in rounds. The way a coach spots where rounds go.
 */
@Component({
  selector: 'app-gap-list',
  imports: [InfoTip, TargetBar],
  templateUrl: './gap-list.html',
  host: { class: 'block min-w-0' },
})
export class GapList {
  public readonly lines = input.required<GapLine[]>();
  /** Name of the first column ('Site', 'Situation', 'Joueur'). */
  public readonly labelHeader = input('Situation');
  public readonly referenceHeader = input('Top ranked');
  public readonly referenceHelp = input<HelpTopic>('topRanked');
  public readonly empty = input('Rien sur cette période.');

  protected readonly rows = computed(() => gapRows(this.lines()));
  protected readonly percent = percent;
  protected readonly gapLabel = gapLabel;

  protected textClass(rating: Rating): string {
    return RATING_TEXT_CLASS[rating];
  }

  /** Left edge of a line, in the colour of its reading. */
  protected accent(rating: Rating): string | null {
    return rating === 'unknown' ? null : `var(${RATING_COLOR_VARIABLE[rating]})`;
  }
}
