import { Component, computed, input } from '@angular/core';

import { Reference } from '@core/common/enums.model';
import { integer } from '@core/format/value-format.utils';
import { ClutchLine, OpeningDuels } from '@core/report/players.model';
import { InfoTip } from '@shared/info-tip/info-tip';

import { clutchFigures, clutchSample, openingFigures } from '../players.utils';
import { StatBars } from '../stat-bars/stat-bars';
import { statBarRows } from '../stat-bars/stat-bars.utils';

/**
 * What the team makes of his opening duels (rounds won after his first bloods and first deaths) and
 * how his clutches end, as gauges against the reference.
 */
@Component({
  selector: 'app-opening-clutch',
  imports: [InfoTip, StatBars],
  templateUrl: './opening-clutch.html',
  host: { class: 'flex flex-col gap-8' },
})
export class OpeningClutch {
  public readonly openingDuels = input.required<OpeningDuels>();
  public readonly clutches = input.required<ClutchLine[]>();
  public readonly reference = input.required<Reference>();
  /** 'Initiateurs adverses'. */
  public readonly referenceName = input.required<string>();

  /** '12 first bloods et 31 first deaths'. */
  protected readonly duelsLine = computed(() => {
    const { firstBloods, firstDeaths } = this.openingDuels();
    return `${integer(firstBloods)} first blood${firstBloods > 1 ? 's' : ''} et ${integer(firstDeaths)} first death${firstDeaths > 1 ? 's' : ''}`;
  });
  protected readonly openingRows = computed(() =>
    statBarRows(openingFigures(this.openingDuels()), this.reference(), this.referenceName()),
  );
  protected readonly clutchRows = computed(() => {
    const lines = this.clutches();
    return statBarRows(clutchFigures(lines), this.reference(), this.referenceName()).map(
      (row, i) => ({ ...row, sample: clutchSample(lines[i]) }),
    );
  });
}
