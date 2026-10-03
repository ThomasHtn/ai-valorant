import { Component, input } from '@angular/core';

import { ValueFormat } from '@core/format/value-format.model';
import { formatValue, integer } from '@core/format/value-format.utils';
import { InfoTip } from '@shared/info-tip/info-tip';

import { CompareGroup, CompareValue } from '../compare.model';

/**
 * The comparison itself: per table of the domain, each metric with A's value, B's value (samples in
 * brackets) and the gap A - B, grey when it can come from chance.
 */
@Component({
  selector: 'app-compare-table',
  imports: [InfoTip],
  templateUrl: './compare-table.html',
  // Capped like the stat tables so labels and figures stay close on wide screens.
  host: { class: 'block min-w-0 overflow-x-auto' },
})
export class CompareTable {
  public readonly groups = input.required<CompareGroup[]>();

  protected value(side: CompareValue, format: ValueFormat): string {
    return formatValue(side.value, format);
  }

  protected sample(side: CompareValue): string {
    // No sample next to a missing value: '— (0)' would read as a measured zero.
    return side.value === null || side.sample === null ? '' : `(${integer(side.sample)})`;
  }
}
