import { Component, computed, input } from '@angular/core';

import { Rate } from '@core/common/common.model';
import { fraction, percent } from '@core/format/format.utils';
import { RATING_FILL_CLASS, RATING_TEXT_CLASS } from '@core/rating/rating.constants';
import { Rating } from '@core/rating/rating.model';
import { rateStat } from '@core/rating/rating.utils';

/** Percentage and a small gauge with a tick at 50 %, both coloured by how the rate reads. */
@Component({
  selector: 'app-rate-bar',
  template: `
    <span class="font-semibold" [class]="textClass()" [attr.title]="title()">{{ text() }}</span>
    @if (width() !== null) {
      <span
        class="relative ml-2 inline-block h-1.5 w-16 bg-surface-sunken align-middle"
        aria-hidden="true"
      >
        <i class="absolute inset-y-0 left-0" [class]="fillClass()" [style.width.%]="width()"></i>
        <b class="absolute -top-0.5 left-1/2 h-2.5 w-px bg-text-muted"></b>
      </span>
    }
  `,
})
export class RateBar {
  public readonly rate = input.required<Rate>();
  /** Defaults to a win rate read against 50 %. */
  public readonly rating = input<Rating | null>(null);

  private readonly resolved = computed(
    () => this.rating() ?? (this.rate().total ? rateStat('winRate', this.rate().value) : 'unknown'),
  );
  protected readonly textClass = computed(() => RATING_TEXT_CLASS[this.resolved()]);
  protected readonly fillClass = computed(() => RATING_FILL_CLASS[this.resolved()]);
  protected readonly text = computed(() => percent(this.rate()));
  protected readonly title = computed(() => fraction(this.rate()));
  protected readonly width = computed(() => {
    const value = this.rate().value;
    return value === null ? null : Math.round(100 * value);
  });
}
