import { Component, input, output } from '@angular/core';

import { CompareOption } from '../compare.model';

/**
 * One side of the comparison: 'Sélection A' (blue edge, the squad's colour) or 'Sélection B'
 * (orange edge), with the select choosing what it reads.
 */
@Component({
  selector: 'app-selection-box',
  template: `
    <h2 class="!m-0 min-w-26 pb-1.5 text-[1.05rem]">Sélection {{ side() }}</h2>
    <label class="flex min-w-0 flex-1 flex-col gap-1">
      <span class="text-sm text-text-muted">{{ fieldLabel() }}</span>
      <select
        class="field-control h-9 w-full"
        [id]="'compare-select-' + side()"
        [value]="value()"
        (change)="changed.emit($any($event.target).value)"
      >
        @for (option of options(); track option.value) {
          <option [value]="option.value" [selected]="option.value === value()">
            {{ option.label }}
          </option>
        }
      </select>
    </label>
  `,
  host: {
    class: 'flex flex-wrap items-end gap-4 border-t-[3px] bg-text-primary/4 px-4 py-2.5',
    '[class.border-squad]': "side() === 'A'",
    '[class.border-opponent]': "side() === 'B'",
  },
})
export class SelectionBox {
  public readonly side = input.required<'A' | 'B'>();
  public readonly fieldLabel = input.required<string>();
  public readonly options = input.required<CompareOption[]>();
  public readonly value = input.required<string>();
  public readonly changed = output<string>();
}
