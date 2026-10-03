import { Component, computed, input } from '@angular/core';

import { Reference } from '@core/common/enums.model';
import { REFERENCE_LABELS } from '@core/format/labels.constants';

/** Swatch classes of the four cell colours, the same utilities the table cells use. */
const SWATCHES = [
  { label: 'Bien', class: 'tone-good ring-rating-good' },
  { label: 'Moyen', class: 'tone-avg ring-rating-average' },
  { label: 'Pas bien', class: 'tone-bad ring-rating-bad' },
  { label: 'Échantillon trop petit', class: 'tone-small ring-text-muted' },
] as const;

/** Key of the cell colours, with the reference they are compared with. */
@Component({
  selector: 'app-tone-legend',
  template: `
    @for (swatch of swatches; track swatch.label) {
      <span class="inline-flex items-center gap-1.5">
        <i
          class="inline-block size-3.5 ring-1 ring-inset"
          [class]="swatch.class"
          aria-hidden="true"
        ></i>
        {{ swatch.label }}
      </span>
    }
    <span class="text-text-muted"
      >Comparé à : {{ referenceLabel() }}{{ mixed() ? historyNote : '' }}</span
    >
  `,
  host: { class: 'flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.95rem] text-text-secondary' },
})
export class ToneLegend {
  public readonly reference = input.required<Reference>();
  /** Some figures are always compared with the squad's history (rounds won, pistols): say so. */
  public readonly mixed = input(false);

  protected readonly historyNote =
    ", sauf les chiffres marqués « vs historique » : l'escouade avant la période";
  protected readonly swatches = SWATCHES;
  protected readonly referenceLabel = computed(() => REFERENCE_LABELS[this.reference()]);
}
