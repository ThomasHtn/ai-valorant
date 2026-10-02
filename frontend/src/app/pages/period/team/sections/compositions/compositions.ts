import { Component, input } from '@angular/core';

import { percent } from '@core/format/format.utils';
import { MapCompositions } from '@core/periods/insights.model';
import { AgentLineup } from '@shared/game-art/agent-lineup';
import { MapName } from '@shared/game-art/map-name';

/** The squad's compositions per map, with the one top ranked teams play the most. */
@Component({
  selector: 'app-compositions',
  imports: [AgentLineup, MapName],
  templateUrl: './compositions.html',
  host: { class: 'table-scroll block' },
})
export class Compositions {
  public readonly maps = input.required<MapCompositions[]>();

  protected readonly percent = percent;
}
