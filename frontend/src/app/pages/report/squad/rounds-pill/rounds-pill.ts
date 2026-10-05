import { Component, computed, input } from '@angular/core';

import { DASH_PILLS } from '../squad.constants';
import { RoundsPill as Pill } from '../squad.model';

/** A gap in rounds as a rounded pill: '−11,5 rounds', red, on a stronger ground past 3 rounds. */
@Component({
  selector: 'app-rounds-pill',
  template: `{{ pill().text }}{{ unit() ? ' ' + pill().unit : '' }}`,
  host: {
    class:
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap tabular-nums',
    '[class]': 'ground()',
  },
})
export class RoundsPill {
  public readonly pill = input.required<Pill>();
  /** Writes 'rounds' (or 'round') after the number. */
  public readonly unit = input(true);

  protected readonly ground = computed(() => {
    const pill = this.pill();
    return pill.strong ? DASH_PILLS[pill.tone].strong : DASH_PILLS[pill.tone].base;
  });
}
