import { Component, computed, input } from '@angular/core';

import { CellTone } from '@core/report/tone.model';

import { BAR_FILLS, BAR_TEXTS } from './gap-bar.constants';

/**
 * A rate as a bar with its value, and a white tick at the reference: the gap reads as the distance
 * between the end of the bar and the tick.
 */
@Component({
  selector: 'app-gap-bar',
  template: `
    <span
      class="relative h-2 min-w-16 flex-1 overflow-hidden bg-surface-sunken/70"
      aria-hidden="true"
    >
      <span class="absolute inset-y-0 left-0" [class]="fill()" [style.width.%]="width()"></span>
      @if (mark() !== null) {
        <span
          class="absolute inset-y-0 -ml-px w-0.5 bg-text-primary/85"
          [style.left.%]="markLeft()"
        ></span>
      }
    </span>
    <b class="min-w-[3.25rem] text-right font-display font-semibold" [class]="text()">{{
      label()
    }}</b>
  `,
  host: { class: 'flex min-w-36 items-center gap-3' },
})
export class GapBar {
  /** Share drawn, 0 to 1 (a rate, or a value over its scale). */
  public readonly value = input.required<number | null>();
  /** Reference on the same scale, drawn as a tick. */
  public readonly mark = input<number | null>(null);
  public readonly tone = input<CellTone | null>(null);
  /** Value as written beside the bar: '48 %'. */
  public readonly label = input.required<string>();

  protected readonly width = computed(() => Math.min(1, Math.max(0, this.value() ?? 0)) * 100);
  protected readonly markLeft = computed(() => Math.min(1, Math.max(0, this.mark() ?? 0)) * 100);
  protected readonly fill = computed(() => BAR_FILLS[this.tone() ?? 'small']);
  protected readonly text = computed(() => BAR_TEXTS[this.tone() ?? 'small']);
}
