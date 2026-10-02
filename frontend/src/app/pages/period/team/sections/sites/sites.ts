import { Component, input } from '@angular/core';

import { percent } from '@core/format/format.utils';
import { Sites as SitesData } from '@core/periods/team.model';
import { HeatCell } from '@shared/heat-cell/heat-cell';
import { InfoTip } from '@shared/info-tip/info-tip';

/** Where the squad plants and how post-plants and retakes go, with the plant tempo and numbers. */
@Component({
  selector: 'app-sites',
  imports: [InfoTip, HeatCell],
  templateUrl: './sites.html',
})
export class Sites {
  public readonly sites = input.required<SitesData>();

  protected readonly percent = percent;
}
