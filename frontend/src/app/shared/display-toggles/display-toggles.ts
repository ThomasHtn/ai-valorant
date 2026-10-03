import { Component, inject } from '@angular/core';

import { ReportState } from '@core/report/report-state';
import { DISPLAY_TOGGLES } from '@shared/filter-bar/filter-bar.constants';

/** Display options of the statistics tables: cell colours, samples, reference values. */
@Component({
  selector: 'app-display-toggles',
  template: `
    @for (toggle of toggles; track toggle.key) {
      <label class="inline-flex h-8 cursor-pointer items-center gap-2 text-text-secondary">
        <input
          type="checkbox"
          class="size-4 accent-brand-500"
          [checked]="state.preferences()[toggle.key]"
          (change)="state.toggle(toggle.key)"
        />
        {{ toggle.label }}
      </label>
    }
  `,
  host: { class: 'flex flex-wrap items-center gap-x-5', role: 'group', 'aria-label': 'Affichage' },
})
export class DisplayToggles {
  protected readonly state = inject(ReportState);
  protected readonly toggles = DISPLAY_TOGGLES;
}
