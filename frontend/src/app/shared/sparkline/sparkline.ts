import { Component, computed, input } from '@angular/core';

import { buildSparkline } from './sparkline.utils';

/** A value over a few months as a tiny amber line over a dashed reference, ending on a dot. */
@Component({
  selector: 'app-sparkline',
  template: `
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      class="absolute inset-0 size-full overflow-visible"
      aria-hidden="true"
    >
      <path [attr.d]="view().area" class="fill-brand-500/12" />
      <path
        [attr.d]="view().line"
        fill="none"
        class="stroke-brand-500"
        stroke-width="1.8"
        vector-effect="non-scaling-stroke"
      />
    </svg>
    @if (view().reference !== null) {
      <span
        class="absolute inset-x-0 border-t border-dashed border-top/55"
        [style.top.%]="view().reference"
      ></span>
    }
    @if (view().end; as end) {
      <span
        class="absolute size-[0.4375rem] -translate-1/2 rounded-full bg-brand-500 shadow-[0_0_0_2px_var(--color-card-ground)]"
        [style.left.%]="end.x"
        [style.top.%]="end.y"
      ></span>
    }
  `,
  host: { class: 'relative block h-7 w-[6.875rem]' },
})
export class Sparkline {
  public readonly values = input.required<readonly (number | null)[]>();
  public readonly reference = input<number | null>(null);

  protected readonly view = computed(() => buildSparkline(this.values(), this.reference()));
}
