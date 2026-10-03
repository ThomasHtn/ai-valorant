import { Component, input, output } from '@angular/core';

import { BuyType, LossCause } from '@core/common/enums.model';
import { LOSS_CAUSE_LABELS } from '@core/format/labels.constants';
import { BUY_SENTENCE_LABELS } from '@core/format/round-labels.constants';

import { RoundFilters } from '../rounds-filter.model';

/** Result, cause, map, side and buy filters of the rounds list. Emits the whole filter set on change. */
@Component({
  selector: 'app-round-filters',
  templateUrl: './round-filters.html',
  host: { class: 'contents' },
})
export class RoundFiltersView {
  public readonly filters = input.required<RoundFilters>();
  public readonly causes = input<readonly LossCause[]>([]);
  public readonly maps = input<readonly string[]>([]);
  public readonly filtersChange = output<RoundFilters>();

  protected readonly causeLabels = LOSS_CAUSE_LABELS;
  protected readonly buys: readonly BuyType[] = ['pistol', 'eco', 'force', 'full'];
  protected readonly buyLabels = BUY_SENTENCE_LABELS;

  protected set<K extends keyof RoundFilters>(key: K, event: Event): void {
    const value = (event.target as HTMLSelectElement).value as RoundFilters[K];
    this.filtersChange.emit({ ...this.filters(), [key]: value });
  }
}
