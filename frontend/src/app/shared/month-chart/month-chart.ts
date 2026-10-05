import { Component, computed, input, output, signal } from '@angular/core';

import { MonthSeries, MonthTick } from './month-chart.model';
import { buildMonthChart, monthTipLines } from './month-chart.utils';

/**
 * Shares month by month as smooth lines over a dashed top ranked line. The SVG stretches to the
 * card while dots and labels stay HTML, so they keep their size; months with few matches draw hollow.
 * Hovering or focusing a month draws a line through it and one tip with every series' value; a
 * click sends the month's key.
 */
@Component({
  selector: 'app-month-chart',
  templateUrl: './month-chart.html',
  host: { class: 'flex flex-col gap-1.5 pl-[2.375rem]' },
})
export class MonthChart {
  public readonly series = input.required<readonly MonthSeries[]>();
  public readonly ticks = input.required<readonly MonthTick[]>();
  /** Top ranked share, drawn dashed; null for none. */
  public readonly reference = input<number | null>(null);
  /** Smallest plot height in pixels; the plot grows when the host is given more room. */
  public readonly height = input(220);
  /** Writes each dot's value over it (one-line charts). */
  public readonly values = input(false);
  /** Accessible name of the chart. */
  public readonly label = input.required<string>();
  /** What a click opens, written in the tip ('les sessions'); null leaves months unclickable. */
  public readonly action = input<string | null>(null);
  /** Key of the clicked month ('2026-07'). */
  public readonly pick = output<string>();

  protected readonly view = computed(() =>
    buildMonthChart(this.series(), this.ticks(), this.reference()),
  );
  /** Index of the month under the pointer or the focus. */
  protected readonly hovered = signal<number | null>(null);
  protected readonly tip = computed(() => {
    const index = this.hovered();
    const tick = index === null ? null : this.view().ticks[index];
    if (index === null || !tick) {
      return null;
    }
    const month = tick.label.toLowerCase();
    return {
      tick,
      lines: monthTipLines(this.series(), index),
      // 'de juillet', "d'août".
      of: /^[aeiouyàâéèêîôû]/.test(month) ? `d'${month}` : `de ${month}`,
      // Past the middle the tip opens to the left of the line, so it never leaves the card.
      flip: tick.x > 60,
    };
  });

  protected choose(index: number): void {
    const tick = this.view().ticks[index];
    if (tick && this.action()) {
      this.pick.emit(tick.key);
    }
  }
}
