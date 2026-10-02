import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { decimal, percentOf } from '@core/format/format.utils';
import { RosterRow } from '@core/periods/player.model';
import { InfoTip } from '@shared/info-tip/info-tip';
import { RatingAgainstClassPipe, RatingClassPipe } from '@shared/rating/rating-class.pipe';

/** One line per squad player; names link to their profile when `linkProfiles` is on. */
@Component({
  selector: 'app-roster-table',
  imports: [RatingClassPipe, RatingAgainstClassPipe, InfoTip, RouterLink],
  templateUrl: './roster-table.html',
  host: { class: 'table-scroll block' },
})
export class RosterTable {
  public readonly rows = input.required<RosterRow[]>();
  public readonly linkProfiles = input(false);

  protected readonly decimal = decimal;
  protected readonly percentOf = percentOf;
}
