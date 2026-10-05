import { Component, computed, input } from '@angular/core';

import { CellTone } from '@core/report/tone.model';

import { RING_RADIUS, RING_TONE_STROKES, RING_TONE_TEXTS } from './ring-gauge.constants';
import { ringDash, ringTick } from './ring-gauge.utils';

/**
 * A share drawn as a ring: the arc is the value, coloured by its tone, a light tick marks the
 * reference, and the value is written in the middle.
 */
@Component({
  selector: 'app-ring-gauge',
  template: `
    <svg viewBox="0 0 36 36" class="absolute inset-0 size-full overflow-visible" aria-hidden="true">
      <circle
        cx="18"
        cy="18"
        [attr.r]="radius"
        fill="none"
        [attr.stroke-width]="width()"
        class="stroke-text-primary/10"
      />
      <circle
        cx="18"
        cy="18"
        [attr.r]="radius"
        fill="none"
        [attr.stroke-width]="width()"
        pathLength="100"
        transform="rotate(-90 18 18)"
        [attr.stroke-dasharray]="dash()"
        [class]="stroke()"
      />
      @if (tick(); as t) {
        <line
          [attr.x1]="t.x1"
          [attr.y1]="t.y1"
          [attr.x2]="t.x2"
          [attr.y2]="t.y2"
          [attr.stroke-width]="width() > 3.5 ? 1.8 : 1.2"
          class="stroke-text-primary"
        />
      }
    </svg>
    @if (label()) {
      <span
        class="relative font-display font-semibold tabular-nums"
        [class]="textClass() + ' ' + text()"
        >{{ label() }}</span
      >
    }
  `,
  host: { class: 'relative grid shrink-0 place-items-center' },
})
export class RingGauge {
  /** Share drawn by the arc, 0..1. */
  public readonly value = input.required<number>();
  /** Reference share marked by a tick; null draws none. */
  public readonly reference = input<number | null>(null);
  public readonly tone = input<CellTone | null>(null);
  /** Text in the middle, already formatted ('48 %'). */
  public readonly label = input('');
  /** Size class of the middle text. */
  public readonly textClass = input('text-lg');
  /** Stroke width in a 36-unit box: thicker for the small rings set beside a figure. */
  public readonly width = input(3.5);

  protected readonly radius = RING_RADIUS;
  protected readonly dash = computed(() => ringDash(this.value()));
  protected readonly tick = computed(() => {
    const reference = this.reference();
    return reference === null ? null : ringTick(reference, this.width());
  });
  protected readonly stroke = computed(() => RING_TONE_STROKES[this.tone() ?? 'none']);
  protected readonly text = computed(() => RING_TONE_TEXTS[this.tone() ?? 'none']);
}
