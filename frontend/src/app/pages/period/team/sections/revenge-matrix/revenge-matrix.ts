import { Component, input } from '@angular/core';

import { percent } from '@core/format/format.utils';
import { RevengeMatrix as RevengeMatrixData } from '@core/periods/insights.model';

/** Who avenges whom: rows are the players who died, columns the teammates who took the revenge. */
@Component({
  selector: 'app-revenge-matrix',
  template: `
    @let m = matrix();
    <p class="caption">
      Lignes : le joueur mort. Colonnes : le coéquipier qui a pris la revenge. Dernière colonne :
      part de ses morts avec revenge.
    </p>
    <div class="table-scroll">
      <table class="data-table">
        <tr>
          <th>Mort revenge par</th>
          @for (name of m.names; track name) {
            <th class="num">{{ name }}</th>
          }
          <th class="num">Avec revenge</th>
        </tr>
        @for (victim of m.names; track victim; let i = $index) {
          <tr>
            <td>{{ victim }}</td>
            @for (count of m.counts[i]; track $index; let j = $index) {
              <td class="num" [class.muted]="i === j">{{ i === j ? '·' : count || '' }}</td>
            }
            <td class="num">{{ percent(m.traded[i]) }}</td>
          </tr>
        }
      </table>
    </div>
  `,
})
export class RevengeMatrix {
  public readonly matrix = input.required<RevengeMatrixData>();

  protected readonly percent = percent;
}
