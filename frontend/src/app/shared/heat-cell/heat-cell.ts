import { Component, computed, input } from '@angular/core';

import { Rate } from '@core/common/common.model';
import { fraction, percent } from '@core/format/format.utils';
import { RATING_COLOR_VARIABLE } from '@core/rating/rating.constants';
import { rateAgainst } from '@core/rating/rating.utils';

import {
  HEAT_AVERAGE_BAND,
  HEAT_AVERAGE_OPACITY,
  HEAT_DEFAULT_SPAN,
  HEAT_MAX_OPACITY,
  HEAT_MIN_OPACITY,
  HEAT_MIN_TOTAL,
} from './heat-cell.constants';

/**
 * Table cell shaded against a reference: green above it, amber close to it, red below, deeper as
 * the gap grows; the text stays in ink. Used as an attribute on a `<td>` so tables keep their layout.
 */
@Component({
  selector: 'td[appHeat]',
  template: '{{ text() }}',
  host: {
    class: 'num',
    '[class.muted]': 'muted()',
    '[style.background]': 'background()',
    '[attr.title]': 'tooltip()',
  },
})
export class HeatCell {
  public readonly rate = input.required<Rate>();
  /** Value the colour is centred on, usually the reference rate. */
  public readonly center = input<number | null | undefined>(0.5);
  public readonly span = input(HEAT_DEFAULT_SPAN);
  /** Extra hover text, after the raw count. */
  public readonly hint = input('');
  public readonly higherIsBetter = input(true);

  protected readonly text = computed(() => percent(this.rate()));
  protected readonly muted = computed(() => this.rate().total < HEAT_MIN_TOTAL);
  protected readonly tooltip = computed(() =>
    [fraction(this.rate()), this.hint()].filter(Boolean).join(' · '),
  );

  protected readonly background = computed(() => {
    const { value, total } = this.rate();
    const center = this.center() ?? 0.5;
    if (value === null || total < HEAT_MIN_TOTAL) {
      return null;
    }
    const rating = rateAgainst(value, center, {
      band: HEAT_AVERAGE_BAND,
      higherIsBetter: this.higherIsBetter(),
    });
    const strength = Math.min(1, Math.abs(value - center) / this.span());
    const opacity =
      rating === 'average'
        ? HEAT_AVERAGE_OPACITY
        : Math.round(HEAT_MIN_OPACITY + strength * (HEAT_MAX_OPACITY - HEAT_MIN_OPACITY));
    return `color-mix(in srgb, var(${RATING_COLOR_VARIABLE[rating]}) ${opacity}%, transparent)`;
  });
}
