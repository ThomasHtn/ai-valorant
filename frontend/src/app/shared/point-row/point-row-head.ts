import { Component } from '@angular/core';

import { InfoTip } from '@shared/info-tip/info-tip';
import { FINDING_COLUMNS } from '@shared/point-card/point-card.constants';

import { POINT_ROW_GRID_CLASS } from './point-row.constants';

/** Names the figure columns of a list of point rows once; hidden on a phone, where rows label them. */
@Component({
  selector: 'app-point-row-head',
  imports: [InfoTip],
  template: `
    <span></span>
    <span class="text-right">L'escouade</span>
    @for (column of columns; track column.label) {
      <span class="inline-flex items-center justify-end gap-1">
        {{ column.label }}
        @if (column.help) {
          <app-info-tip [topic]="column.help" />
        }
      </span>
    }
  `,
  host: {
    class: `${POINT_ROW_GRID_CLASS} !hidden border-l-2 border-transparent px-4 pb-1.5 text-sm font-medium text-text-secondary sm:!grid`,
    'aria-hidden': 'true',
  },
})
export class PointRowHead {
  protected readonly columns = FINDING_COLUMNS;
}
