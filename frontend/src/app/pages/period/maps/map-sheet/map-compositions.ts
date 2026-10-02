import { Component, input } from '@angular/core';

import { percent } from '@core/format/format.utils';
import { MapCompositionsDetail } from '@core/periods/map-sheet.model';
import { AgentLineup } from '@shared/game-art/agent-lineup';
import { AgentName } from '@shared/game-art/agent-name';
import { InfoTip } from '@shared/info-tip/info-tip';

/** The squad's compositions on a map, and what top ranked teams play there. */
@Component({
  selector: 'app-map-compositions',
  imports: [AgentLineup, AgentName, InfoTip],
  templateUrl: './map-compositions.html',
})
export class MapCompositionsView {
  public readonly compositions = input.required<MapCompositionsDetail>();
  public readonly hasTopReference = input.required<boolean>();

  protected readonly percent = percent;
}
