import { Component, computed, input } from '@angular/core';

import { CellValue } from '@core/report/stat-table.model';

import { parseRecord } from './win-loss.utils';

/**
 * Matches won and lost as two table cells, wins in green and losses in red, placed where `<td>`s are
 * expected. Résumé, Joueurs and Toutes les stats draw every V-D column with it.
 */
@Component({
  selector: 'app-win-loss-cells',
  template: `
    <td [class]="cellClass()">
      <span class="font-semibold text-rating-good">{{ record()?.wins ?? '' }}</span>
    </td>
    <td [class]="cellClass()">
      <span class="font-semibold text-rating-bad">{{ record()?.losses ?? '' }}</span>
    </td>
  `,
  host: { class: 'contents' },
})
export class WinLossCells {
  /** The record cell's value, e.g. '12-15'. */
  public readonly value = input.required<CellValue | undefined>();
  /** Ground of the row (total rows are a little lighter). */
  public readonly ground = input('bg-text-primary/4');

  protected readonly record = computed(() => parseRecord(this.value()));
  protected readonly cellClass = computed(
    () => `px-2.5 py-1.5 text-right align-middle whitespace-nowrap ${this.ground()}`,
  );
}
