import { Component, computed, input } from '@angular/core';

import { RateVsReference } from '@core/common/common.model';
import { percent } from '@core/format/format.utils';
import { Situations as SituationsData } from '@core/periods/team.model';
import { Rating } from '@core/rating/rating.model';
import { rateAgainst } from '@core/rating/rating.utils';
import { HeatCell } from '@shared/heat-cell/heat-cell';
import { StatTile } from '@shared/stat-tile/stat-tile';
import { STAT_BAND_CLASS } from '@shared/stat-tile/stat-tile.constants';
import { InfoTip } from '@shared/info-tip/info-tip';

/** Rounds won after going through each numbers situation, throws and comebacks. */
@Component({
  selector: 'app-situations',
  imports: [InfoTip, HeatCell, StatTile],
  templateUrl: './situations.html',
})
export class Situations {
  public readonly situations = input.required<SituationsData>();

  protected readonly percent = percent;
  protected readonly bandClass = STAT_BAND_CLASS;

  /** More throws than top ranked players is bad news; more comebacks is good news. */
  protected readonly throwsRating = computed(() => this.rating(this.situations().throws, false));
  protected readonly comebacksRating = computed(() =>
    this.rating(this.situations().comebacks, true),
  );

  private rating(rates: RateVsReference, higherIsBetter: boolean): Rating {
    return rateAgainst(rates.squad.value, rates.reference?.value, { higherIsBetter });
  }
}
