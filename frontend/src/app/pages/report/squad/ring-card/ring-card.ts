import { Component, computed, input } from '@angular/core';
import { LucideArrowDown, LucideArrowUp, LucideMinus } from '@lucide/angular';

import { InfoTip } from '@shared/info-tip/info-tip';
import { RingGauge } from '@shared/ring-gauge/ring-gauge';

import { DASH_PILLS, DASH_RINGS, DASH_TEXTS } from '../squad.constants';
import { RingKpi } from '../squad.model';

/** A headline card: big ring with the value inside and the top ranked tick, then label, sample and change. */
@Component({
  selector: 'app-ring-card',
  imports: [InfoTip, LucideArrowDown, LucideArrowUp, LucideMinus, RingGauge],
  template: `
    <app-ring-gauge
      class="size-20"
      [value]="kpi().share ?? 0"
      [reference]="kpi().mark"
      [tone]="ring()"
      [width]="3.4"
      [label]="kpi().value + ' %'"
      [textClass]="'text-[1.375rem] font-medium ' + text()"
    />
    <div class="flex min-w-0 flex-col gap-1">
      <strong class="flex items-center gap-1 text-[1.0625rem] font-semibold"
        >{{ kpi().label }}<app-info-tip [topic]="kpi().help"
      /></strong>
      <span class="text-xs text-text-muted">{{ kpi().sub }}</span>
    </div>
    @if (kpi().delta; as delta) {
      <span
        class="inline-flex items-center gap-1 col-span-2 justify-self-start rounded-full py-0.5 pr-2 pl-1.5 text-xs font-semibold whitespace-nowrap"
        [class]="pills[delta.tone].base"
      >
        @switch (delta.direction) {
          @case ('up') {
            <svg lucideArrowUp class="size-3.5" [strokeWidth]="2.4" aria-hidden="true"></svg>
          }
          @case ('down') {
            <svg lucideArrowDown class="size-3.5" [strokeWidth]="2.4" aria-hidden="true"></svg>
          }
          @default {
            <svg lucideMinus class="size-3.5" [strokeWidth]="2.4" aria-hidden="true"></svg>
          }
        }
        {{ delta.text }} vs {{ since() }}
      </span>
    }
  `,
  host: { class: 'dash-card !grid grid-cols-[auto_minmax(0,1fr)] items-center !gap-x-4 !gap-y-3' },
})
export class RingCard {
  public readonly kpi = input.required<RingKpi>();
  /** What the change is measured against, 'avant septembre'. */
  public readonly since = input.required<string>();

  protected readonly pills = DASH_PILLS;
  protected readonly ring = computed(() => DASH_RINGS[this.kpi().tone]);
  protected readonly text = computed(() => DASH_TEXTS[this.kpi().tone]);
}
