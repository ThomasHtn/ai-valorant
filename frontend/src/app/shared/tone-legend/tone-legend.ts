import { Component, computed, input } from '@angular/core';

import { Reference } from '@core/common/enums.model';
import { REFERENCE_ROLE_SENTENCES, REFERENCE_SENTENCES } from '@core/format/labels.constants';
import { StatHelp } from '@core/help/stat-help.model';
import { InfoTip } from '@shared/info-tip/info-tip';

/** Swatch classes of the three judged cell colours, the same utilities the table cells use. */
const SWATCHES = [
  { label: 'Mieux', class: 'tone-good ring-rating-good' },
  { label: 'Proche', class: 'tone-avg ring-rating-average' },
  { label: 'Moins bien', class: 'tone-bad ring-rating-bad' },
] as const;

/** Key of the cell colours: three swatches, what they are compared with folded into the "i". */
@Component({
  selector: 'app-tone-legend',
  imports: [InfoTip],
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
    <app-info-tip [content]="help()" />
  `,
  host: { class: 'flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.95rem] text-text-secondary' },
})
export class ToneLegend {
  public readonly reference = input.required<Reference>();
  /** A player's figures, measured against players of his role. */
  public readonly perRole = input(false);
  /** Some figures are always compared with the squad's history (rounds won, pistols): say so. */
  public readonly mixed = input(false);

  protected readonly swatches = SWATCHES;
  protected readonly help = computed<StatHelp>(() => {
    const sentence = (this.perRole() ? REFERENCE_ROLE_SENTENCES : REFERENCE_SENTENCES)[
      this.reference()
    ];
    return {
      title: 'Couleurs',
      what: `Chaque chiffre est comparé ${sentence}.`,
      how: this.mixed()
        ? "Gris : trop peu de données pour juger. « vs avant … » sous une colonne : comparé à l'escouade avant la période."
        : 'Gris : trop peu de données pour juger.',
    };
  });
}
