import { Pipe, PipeTransform } from '@angular/core';

import { RATING_TEXT_CLASS, RatedStat } from '@core/rating/rating.constants';
import { rateAgainst, rateStat } from '@core/rating/rating.utils';

/** Text colour of a benchmarked stat: `[class]="row.acs | ratingClass: 'acs'"`. */
@Pipe({ name: 'ratingClass' })
export class RatingClassPipe implements PipeTransform {
  public transform(value: number | null | undefined, stat: RatedStat): string {
    return RATING_TEXT_CLASS[rateStat(stat, value)];
  }
}

/**
 * Text colour of a value against a reference: `row.firstBloods | ratingAgainstClass: row.firstDeaths : 0`.
 * `band` is the gap that still reads average.
 */
@Pipe({ name: 'ratingAgainstClass' })
export class RatingAgainstClassPipe implements PipeTransform {
  public transform(
    value: number | null | undefined,
    reference: number | null | undefined,
    band?: number,
    higherIsBetter = true,
  ): string {
    return RATING_TEXT_CLASS[rateAgainst(value, reference, { band, higherIsBetter })];
  }
}
