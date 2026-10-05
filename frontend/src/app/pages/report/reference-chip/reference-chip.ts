import { Component, computed, inject } from '@angular/core';

import { resourceValue } from '@core/http/resource-state.utils';
import { ReportContext } from '@core/report/report-context';
import { InfoTip } from '@shared/info-tip/info-tip';

/**
 * What every figure is compared with, in the top bar: the top ranked, and on which patches when
 * the reference mixes two of them (a new patch still filling up).
 */
@Component({
  selector: 'app-reference-chip',
  imports: [InfoTip],
  template: `
    <span
      class="hidden h-7 items-center gap-1 border border-edge bg-text-primary/5 px-2.5 text-sm font-semibold whitespace-nowrap text-text-secondary sm:inline-flex"
    >
      Référence : top ranked{{ patches() }}<app-info-tip topic="reference" />
    </span>
  `,
  host: { class: 'ml-auto contents sm:flex' },
})
export class ReferenceChip {
  private readonly context = inject(ReportContext);

  /** ', patch 13.06' or ', patchs 13.06 et 13.07'. */
  protected readonly patches = computed(() => {
    const patches = resourceValue(this.context.meta, null)?.quality.topPatches ?? [];
    if (!patches.length) {
      return '';
    }
    return patches.length === 1
      ? `, patch ${patches[0]}`
      : `, patchs ${patches.slice(0, -1).join(', ')} et ${patches.at(-1)}`;
  });
}
