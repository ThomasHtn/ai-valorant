import { Component, input } from '@angular/core';

import { percent } from '@core/format/format.utils';
import { DriverGroup } from '@core/periods/insights.model';
import { HeatCell } from '@shared/heat-cell/heat-cell';
import { InfoTip } from '@shared/info-tip/info-tip';

/** Round win rate by situation, coloured against top ranked games in the same situation. */
@Component({
  selector: 'app-round-drivers',
  imports: [InfoTip, HeatCell],
  templateUrl: './round-drivers.html',
})
export class RoundDrivers {
  public readonly groups = input.required<DriverGroup[]>();

  protected readonly percent = percent;
}
