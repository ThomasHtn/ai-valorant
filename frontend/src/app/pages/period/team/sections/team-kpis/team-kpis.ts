import { Component, input } from '@angular/core';

import { Tone } from '@core/common/enums.model';
import { fraction, percent, pointsChange, signedPoints } from '@core/format/format.utils';
import { Rate } from '@core/common/common.model';
import { KpiRate, TeamKpis as TeamKpisData } from '@core/periods/team.model';
import { Rating } from '@core/rating/rating.model';
import { rateStat } from '@core/rating/rating.utils';
import { StatTile } from '@shared/stat-tile/stat-tile';
import { STAT_BAND_CLASS } from '@shared/stat-tile/stat-tile.constants';

/** Headline tiles, with the change against the comparison period (named once above the strip). */
@Component({
  selector: 'app-team-kpis',
  imports: [StatTile],
  templateUrl: './team-kpis.html',
  host: { class: STAT_BAND_CLASS },
})
export class TeamKpis {
  public readonly kpis = input.required<TeamKpisData>();

  protected readonly percent = percent;
  protected readonly fraction = fraction;

  protected change(kpi: KpiRate): string | null {
    const points = pointsChange(kpi.current, kpi.previous);
    return points === null ? null : signedPoints(points);
  }

  /** A share of rounds read against 50 %. */
  protected winRating(rate: Rate): Rating {
    return rate.total ? rateStat('winRate', rate.value) : 'unknown';
  }

  protected kastRating(rate: Rate): Rating {
    return rate.total ? rateStat('kast', rate.value) : 'unknown';
  }

  protected tone(kpi: KpiRate): Tone {
    const points = pointsChange(kpi.current, kpi.previous) ?? 0;
    return points > 0 ? 'good' : points < 0 ? 'bad' : 'neutral';
  }
}
