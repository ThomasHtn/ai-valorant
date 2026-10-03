import { Component, computed, input } from '@angular/core';

import { GAP_CHIP_SIZES, GAP_CHIP_TONES } from './gap-chip.constants';
import { GapChipSize, GapChipTone } from './gap-chip.model';

/**
 * A gap in rounds ('−11,0', '+4,5') on a tinted square block, so the figure that ranks a finding
 * stands out from the text around it. The unit, if any, sits under the figure.
 */
@Component({
  selector: 'app-gap-chip',
  template: `
    <span class="font-semibold text-text-primary" [class]="sizes().value">{{ value() }}</span>
    @if (unit(); as unit) {
      <span class="mt-0.5 text-xs whitespace-nowrap text-text-secondary">{{ unit }}</span>
    }
  `,
  host: {
    class: 'inline-flex shrink-0 flex-col items-end border-l-[3px] tabular-nums',
    '[class]': 'hostClass()',
  },
})
export class GapChip {
  /** Already formatted gap. */
  public readonly value = input.required<string>();
  public readonly unit = input<string | null>(null);
  public readonly tone = input<GapChipTone>('neutral');
  public readonly size = input<GapChipSize>('lg');

  protected readonly sizes = computed(() => GAP_CHIP_SIZES[this.size()]);
  protected readonly hostClass = computed(
    () => `${GAP_CHIP_TONES[this.tone()]} ${this.sizes().box}`,
  );
}
