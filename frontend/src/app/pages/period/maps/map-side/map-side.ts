import { Component, computed, input } from '@angular/core';

import { percent } from '@core/format/format.utils';
import { MapSide } from '@core/periods/map-sheet.model';
import { DuelMap } from '@shared/duel-map/duel-map';
import { DuelMapLegend } from '@shared/duel-map/duel-map-legend';
import { HeatCell } from '@shared/heat-cell/heat-cell';
import { InfoTip } from '@shared/info-tip/info-tip';

/** One side of a map: plant sites, opening duels, rounds without plant, first death spots. */
@Component({
  selector: 'app-map-side',
  imports: [HeatCell, DuelMap, DuelMapLegend, InfoTip],
  templateUrl: './map-side.html',
})
export class MapSideView {
  public readonly side = input.required<MapSide>();
  public readonly hasTopReference = input.required<boolean>();

  protected readonly percent = percent;
  protected readonly isAttack = computed(() => this.side().side === 'att');

  /** Top ranked value, or '-' when the map has no reference. */
  protected top(rate: Parameters<typeof percent>[0]): string {
    return this.hasTopReference() ? percent(rate) : '-';
  }
}
