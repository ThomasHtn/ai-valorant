import { Component, computed, input } from '@angular/core';
import { LucideArrowDown, LucideArrowUp, LucideEqual } from '@lucide/angular';

import { HoverTip } from '@shared/hover-tip/hover-tip';
import { InfoTip } from '@shared/info-tip/info-tip';
import { RingGauge } from '@shared/ring-gauge/ring-gauge';
import { TONE_TEXT_CLASSES } from '@shared/stat-tile/stat-tile.constants';

import { HeadlineTile } from './headline-tile.model';

/** Ground and text of the gap badge per tone, so the arrow reads green or red at a glance. */
const DELTA_CLASSES: Record<string, string> = {
  good: 'bg-rating-good/18 text-rating-good',
  avg: 'bg-rating-average/18 text-rating-average',
  bad: 'bg-rating-bad/20 text-rating-bad',
  small: 'bg-text-primary/8 text-text-muted',
  none: 'bg-text-primary/8 text-text-secondary',
};

/**
 * One figure of the Résumé's Bilan: a ring for rates (arc = value, tick = reference), the value, then
 * the gap with the reference as a green or red arrow whose meaning shows on hover.
 */
@Component({
  selector: 'app-headline-tile',
  imports: [HoverTip, InfoTip, LucideArrowDown, LucideArrowUp, LucideEqual, RingGauge],
  template: `
    @let t = tile();
    <span class="text-sm text-text-secondary">{{ t.label }}<app-info-tip [topic]="t.help" /></span>
    <div class="flex items-center gap-3">
      @if (t.ring; as ring) {
        <app-ring-gauge
          class="size-16"
          [value]="ring.value"
          [reference]="ring.reference"
          [tone]="t.tone"
          [label]="t.value"
          textClass="text-base"
        />
      } @else {
        <span
          class="grid min-h-16 items-center font-display text-[1.6rem] leading-none font-semibold tabular-nums"
          [class]="valueClass()"
          >{{ t.value }}
          @if (t.unit) {
            <small class="mt-1 font-sans text-sm font-medium">{{ t.unit }}</small>
          }
        </span>
      }
      <div class="flex min-w-0 flex-col items-start gap-1">
        @if (t.delta; as d) {
          <span
            class="focus-ring inline-flex cursor-help items-center gap-1 px-1.5 py-0.5 text-sm font-semibold tabular-nums"
            [class]="deltaClass()"
            tabindex="0"
            [appHoverTip]="t.tip"
          >
            @switch (d.direction) {
              @case ('up') {
                <svg lucideArrowUp class="size-4" aria-hidden="true"></svg>
              }
              @case ('down') {
                <svg lucideArrowDown class="size-4" aria-hidden="true"></svg>
              }
              @default {
                <svg lucideEqual class="size-4" aria-hidden="true"></svg>
              }
            }
            {{ d.text }}
          </span>
        }
        @if (t.referenceLine) {
          <span class="text-sm leading-tight text-text-muted">{{ t.referenceLine }}</span>
        }
      </div>
    </div>
    @if (t.sample) {
      <span class="text-sm text-text-muted">{{ t.sample }}</span>
    }
  `,
  host: { class: 'flex min-w-0 flex-col gap-2 bg-text-primary/4 px-3 py-2.5' },
})
export class HeadlineTileView {
  public readonly tile = input.required<HeadlineTile>();

  protected readonly valueClass = computed(() => {
    const tone = this.tile().tone;
    return tone ? TONE_TEXT_CLASSES[tone] : 'text-text-primary';
  });
  protected readonly deltaClass = computed(() => DELTA_CLASSES[this.tile().tone ?? 'none']);
}
