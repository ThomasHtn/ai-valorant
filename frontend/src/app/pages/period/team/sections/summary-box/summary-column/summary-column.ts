import { Component, input } from '@angular/core';

import { PointRow } from '@shared/point-row/point-row';
import { PointRowHead } from '@shared/point-row/point-row-head';
import { PointRowContent } from '@shared/point-row/point-row.model';

/** One half of "À retenir" (weaknesses or strengths): its title, the column names, then the rows. */
@Component({
  selector: 'app-summary-column',
  imports: [PointRow, PointRowHead],
  template: `
    <h3 class="!mt-0">{{ title() }}</h3>
    <app-point-row-head />
    @for (row of rows(); track $index) {
      <app-point-row [card]="row.card" [matches]="row.matches" [wording]="row.wording" />
    }
  `,
  host: { class: 'block min-w-0' },
})
export class SummaryColumn {
  public readonly title = input.required<string>();
  public readonly rows = input.required<PointRowContent[]>();
}
