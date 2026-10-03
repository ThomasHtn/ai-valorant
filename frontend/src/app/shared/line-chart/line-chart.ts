import { Component, computed, input, signal } from '@angular/core';

import { ValueFormat } from '@core/format/value-format.model';

import { ChartMarker, DotView, LinePoint } from './line-chart.model';
import { buildLineChart } from './line-chart.utils';

/**
 * A value over time, drawn to scale in inline SVG: one dot per point with its value and sample, gaps
 * where nothing was played, dashed markers (patch changes), a dashed reference line (top ranked).
 * Points under `minSample` turn grey; the report's period is ringed in amber. Hovering or focusing a
 * dot opens its tip.
 */
@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.html',
  host: { class: 'relative block' },
})
export class LineChart {
  public readonly points = input.required<LinePoint[]>();
  public readonly format = input.required<ValueFormat>();
  /** Top ranked value, drawn as a dashed line; null to leave it out. */
  public readonly reference = input<number | null>(null);
  public readonly referenceLabel = input('Top ranked');
  public readonly markers = input<ChartMarker[]>([]);
  /** Sample under which a point turns grey. */
  public readonly minSample = input(20);
  /** Accessible name of the chart. */
  public readonly label = input.required<string>();

  protected readonly view = computed(() =>
    buildLineChart(
      this.points(),
      this.format(),
      this.reference(),
      this.referenceLabel(),
      this.markers(),
      this.minSample(),
    ),
  );
  protected readonly hovered = signal<DotView | null>(null);
}
