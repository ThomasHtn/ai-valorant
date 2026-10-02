import { Component, input } from '@angular/core';

import { MatchRecord } from '@core/common/common.model';
import { HeatCell } from '@shared/heat-cell/heat-cell';

/** Three cells: matches, wins-losses and rounds won (coloured around 50 %). Used inside a `<tr>`. */
@Component({
  selector: 'app-match-record-cells',
  imports: [HeatCell],
  template: `
    <td class="num">{{ record().matches }}</td>
    <td class="num">{{ record().wins }}-{{ record().losses }}</td>
    <td appHeat [rate]="record().rounds" [hint]="'rounds gagnés'"></td>
  `,
  host: { class: 'contents' },
})
export class MatchRecordCells {
  public readonly record = input.required<MatchRecord>();
}
