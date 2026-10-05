import { Component, inject, input } from '@angular/core';

import { Reference } from '@core/common/enums.model';
import { ViewState } from '@core/report/view-state';
import { REFERENCE_OPTIONS } from '@shared/filter-bar/filter-bar.constants';
import { InfoTip } from '@shared/info-tip/info-tip';
import { ToneLegend } from '@shared/tone-legend/tone-legend';

/**
 * How the coloured figures of a view read: what they are compared with, then the colour key. Only
 * Comparer lets the analyst pick the reference; the other views always read against the top ranked.
 */
@Component({
  selector: 'app-reading-bar',
  imports: [InfoTip, ToneLegend],
  template: `
    <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
      @if (state.referenceChoice) {
        <div class="flex flex-wrap items-center gap-2">
          <span class="filter-label">Comparer à<app-info-tip topic="reference" /></span>
          <div class="seg-group flex-wrap" role="group" aria-label="Comparer à">
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
      } @else {
        <span class="filter-label"
          >Comparé au top ranked{{ perRole() ? ' du même rôle' : ''
          }}<app-info-tip topic="reference"
        /></span>
      }
      <app-tone-legend
        class="ml-auto"
        [reference]="state.preferences().reference"
        [perRole]="perRole()"
        [mixed]="mixed()"
      />
    </div>
  `,
  host: { class: 'block border-b border-edge-strong pb-3' },
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
