import { Component, input } from '@angular/core';

import { decimal, percent } from '@core/format/format.utils';
import { SIDE_LABELS } from '@core/format/labels.constants';
import { Opening as OpeningData } from '@core/periods/team.model';
import { DuelMap } from '@shared/duel-map/duel-map';
import { DuelMapLegend } from '@shared/duel-map/duel-map-legend';
import { HeatCell } from '@shared/heat-cell/heat-cell';
import { RateBar } from '@shared/rate-bar/rate-bar';
import { InfoTip } from '@shared/info-tip/info-tip';

/** Opening duels: who takes the first blood, what follows, where it happens, and per player. */
@Component({
  selector: 'app-opening',
  imports: [InfoTip, HeatCell, RateBar, DuelMap, DuelMapLegend],
  templateUrl: './opening.html',
})
export class Opening {
  public readonly opening = input.required<OpeningData>();

  protected readonly percent = percent;
  protected readonly decimal = decimal;
  protected readonly sideLabels = SIDE_LABELS;
}
