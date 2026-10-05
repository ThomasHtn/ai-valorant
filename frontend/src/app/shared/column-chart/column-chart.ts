import { Component, input, output } from '@angular/core';

import { BAR_FILLS, BAR_TEXTS } from '@shared/gap-bar/gap-bar.constants';

import { CHART_MAX, CHART_MIN } from './column-chart.constants';
import { ChartColumn } from './column-chart.model';

/**
 * Shares as columns over a dashed reference line (50 % by default): a month read session by
 * session, a session read match by match. A column opens what it stands for.
 */
@Component({
  selector: 'app-column-chart',
  template: `
    <div class="relative flex h-40 items-end gap-1.5 border-b border-edge-strong sm:gap-2.5">
      <span
        class="pointer-events-none absolute inset-x-0 border-t border-dashed border-text-primary/45"
        [style.bottom.%]="height(reference())"
        aria-hidden="true"
      >
        <small class="absolute -top-5 left-0 text-xs text-text-muted">{{ referenceLabel() }}</small>
      </span>
      @for (column of columns(); track column.key) {
        <button
          type="button"
          class="focus-ring group relative flex h-full min-w-0 flex-1 cursor-pointer flex-col items-center justify-end"
          [title]="column.title"
          (click)="open.emit(column.key)"
        >
          <b
            class="mb-1 font-display text-sm font-semibold tabular-nums"
            [class]="texts[column.tone]"
            >{{ column.text }}</b
          >
          <span
            class="w-full max-w-14 transition-[filter] group-hover:brightness-125"
            [class]="fills[column.tone]"
            [style.height.%]="height(column.value)"
          ></span>
        </button>
      }
    </div>
    <div class="mt-1.5 flex gap-1.5 sm:gap-2.5">
      @for (column of columns(); track column.key) {
        <span class="min-w-0 flex-1 truncate text-center text-xs text-text-muted sm:text-sm">{{
          column.label
        }}</span>
      }
    </div>
  `,
  host: { class: 'block' },
})
export class ColumnChart {
  public readonly columns = input.required<readonly ChartColumn[]>();
  /** Share of the dashed line. */
  public readonly reference = input(0.5);
  public readonly referenceLabel = input('50 %');
  public readonly open = output<string>();

  protected readonly fills = BAR_FILLS;
  protected readonly texts = BAR_TEXTS;

  /** Height in % of the plot: shares between 20 and 80 % fill it, so close sessions still differ. */
  protected height(value: number | null): number {
    const share = Math.min(CHART_MAX, Math.max(CHART_MIN, value ?? CHART_MIN));
    return ((share - CHART_MIN) / (CHART_MAX - CHART_MIN)) * 80 + 4;
  }
}
