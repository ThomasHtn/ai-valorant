import { Component, inject } from '@angular/core';

import { Reference } from '@core/common/enums.model';
import { ReportState } from '@core/report/report-state';
import { REFERENCE_OPTIONS } from '@shared/filter-bar/filter-bar.constants';
import { InfoTip } from '@shared/info-tip/info-tip';

/**
 * Reference switch of the Joueurs view. It writes its own preference (opponents of the same role by
 * default) so choosing top ranked here never changes the other views, and the reverse.
 */
@Component({
  selector: 'app-player-reference',
  imports: [InfoTip],
  template: `
    <span class="filter-label">Référence<app-info-tip topic="reference" /></span>
    <div class="seg-group" role="group" aria-label="Référence">
      @for (option of options; track option.value) {
        <button
          type="button"
          class="seg-option"
          [attr.aria-pressed]="state.preferences().playerReference === option.value"
          (click)="select(option.value)"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
  host: { class: 'flex items-center gap-2' },
})
export class PlayerReference {
  protected readonly state = inject(ReportState);
  protected readonly options = REFERENCE_OPTIONS;

  protected select(reference: Reference): void {
    this.state.setPlayerReference(reference);
  }
}
