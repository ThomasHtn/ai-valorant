import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { fraction, percent } from '@core/format/format.utils';
import { MapPoolRow } from '@core/periods/team.model';
import { MapName } from '@shared/game-art/map-name';
import { RateBar } from '@shared/rate-bar/rate-bar';
import { InfoTip } from '@shared/info-tip/info-tip';

/** Results per map, most played first; each map links to its sheet. */
@Component({
  selector: 'app-map-pool',
  imports: [RouterLink, InfoTip, MapName, RateBar],
  templateUrl: './map-pool.html',
  host: { class: 'table-scroll block' },
})
export class MapPool {
  public readonly rows = input.required<MapPoolRow[]>();

  protected readonly percent = percent;
  protected readonly fraction = fraction;
}
