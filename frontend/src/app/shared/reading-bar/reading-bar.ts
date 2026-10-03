import { Component, inject, input } from '@angular/core';

import { Reference } from '@core/common/enums.model';
import { ViewState } from '@core/report/view-state';
import { DisplayToggles } from '@shared/display-toggles/display-toggles';
import { REFERENCE_OPTIONS } from '@shared/filter-bar/filter-bar.constants';
import { InfoTip } from '@shared/info-tip/info-tip';
import { ToneLegend } from '@shared/tone-legend/tone-legend';

/**
 * How the coloured figures of a view read: what they are compared with, the display options, then
 * the colour key in one sentence. Sits right over the figures it governs and only changes this view.
 */
@Component({
  selector: 'app-reading-bar',
  imports: [DisplayToggles, InfoTip, ToneLegend],
  template: `
    <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
      <div class="flex items-center gap-2">
        <span class="filter-label">Comparer à<app-info-tip topic="reference" /></span>
        <div class="seg-group" role="group" aria-label="Comparer à">
          @for (option of options; track option.value) {
            <button
              type="button"
              class="seg-option"
              [attr.aria-pressed]="state.preferences().reference === option.value"
              (click)="select(option.value)"
            >
              {{ option.label }}
            </button>
          }
        </div>
      </div>
      <app-display-toggles class="ml-auto" />
    </div>
    <app-tone-legend
      [reference]="state.preferences().reference"
      [perRole]="perRole()"
      [mixed]="mixed()"
    />
  `,
  host: { class: 'flex flex-col gap-2 border-b border-edge-strong pb-3' },
})
export class ReadingBar {
  /** A player's figures, measured against players of his role. */
  public readonly perRole = input(false);
  /** Some columns are always compared with the squad's history. */
  public readonly mixed = input(false);

  protected readonly state = inject(ViewState);
  protected readonly options = REFERENCE_OPTIONS;

  protected select(reference: Reference): void {
    this.state.setReference(reference);
  }
}
