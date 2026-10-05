import { Component, computed, input } from '@angular/core';

import { DONUT_RADIUS, DONUT_WIDTH } from './donut.constants';
import { DonutSlice } from './donut.model';
import { donutArcs } from './donut.utils';

/** Shares of a whole as a ring of slices; the projected content is written in the middle. */
@Component({
  selector: 'app-donut',
  template: `
    <svg viewBox="0 0 140 140" class="size-full" aria-hidden="true">
      <circle
        cx="70"
        cy="70"
        [attr.r]="radius"
        fill="none"
        [attr.stroke-width]="width"
        class="stroke-text-primary/8"
      />
      @for (arc of arcs(); track arc.key) {
        <circle
          cx="70"
          cy="70"
          [attr.r]="radius"
          fill="none"
          [attr.stroke]="arc.color"
          [attr.stroke-width]="width"
          [attr.stroke-dasharray]="arc.dash"
          [attr.stroke-dashoffset]="arc.offset"
          transform="rotate(-90 70 70)"
        />
      }
    </svg>
    <div class="absolute inset-0 flex flex-col items-center justify-center leading-tight">
      <ng-content />
    </div>
  `,
  host: { class: 'relative block size-35 shrink-0' },
})
export class Donut {
  public readonly slices = input.required<readonly DonutSlice[]>();

  protected readonly radius = DONUT_RADIUS;
  protected readonly width = DONUT_WIDTH;
  protected readonly arcs = computed(() => donutArcs(this.slices()));
}
