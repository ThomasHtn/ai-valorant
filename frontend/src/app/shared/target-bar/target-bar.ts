import { Component, computed, input } from '@angular/core';

import { Rate } from '@core/common/common.model';
import { RATING_FILL_CLASS } from '@core/rating/rating.constants';
import { Rating } from '@core/rating/rating.model';

/** A rate as a bar from 0 to 100 %, with a tick where the reference stands. */
@Component({
  selector: 'app-target-bar',
  template: `
    <i class="absolute inset-y-0 left-0" [class]="fillClass()" [style.width.%]="width()"></i>
    @if (target() !== null) {
      <b class="absolute -inset-y-1 w-0.5 bg-text-primary" [style.left.%]="target()"></b>
    }
  `,
  host: { class: 'relative block h-2 w-full bg-surface-sunken', 'aria-hidden': 'true' },
})
export class TargetBar {
  public readonly rate = input.required<Rate>();
  /** Reference rate drawn as a tick; none when unknown. */
  public readonly reference = input<Rate | null>(null);
  public readonly rating = input<Rating>('unknown');

  protected readonly fillClass = computed(() => RATING_FILL_CLASS[this.rating()]);
  protected readonly width = computed(() => Math.round(100 * (this.rate().value ?? 0)));
  protected readonly target = computed(() => {
    const value = this.reference()?.value;
    return value === null || value === undefined ? null : Math.round(100 * value);
  });
}
