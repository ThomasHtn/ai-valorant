import { Component, computed, input } from '@angular/core';

import { resolveSeriesColor, token } from '@shared/chart/chart-theme.utils';
import { ChartSeries, ChartValueFormatter } from '@shared/chart/chart.model';
import { LineChart } from '@shared/chart/line-chart';

import {
  FORM_DOTS_MAX_MATCHES,
  FORM_MATCH_COLOR,
  FORM_MATCH_DOT_RADIUS,
  FORM_ROLLING_WINDOW,
} from './form-chart.constants';
import { FormChartPoint } from './form-chart.model';

/**
 * Form over the period, on ValoQuests' line chart: each match as a faint curve, the rolling average
 * in amber over it, and a dashed reference (50 %, or top ranked players' level), named in a legend.
 */
@Component({
  selector: 'app-form-chart',
  imports: [LineChart],
  template: `
    <ul class="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-text-secondary" aria-hidden="true">
      @for (item of series(); track item.label) {
        <li class="flex items-center gap-2">
          <span
            class="w-5 border-t-2"
            [class.border-dashed]="item.dashed"
            [style.border-color]="item.color"
          ></span>
          {{ item.label }}
        </li>
      }
    </ul>
    <app-line-chart
      [series]="series()"
      [xLabels]="labels()"
      [pointTitles]="titles()"
      [ariaLabel]="label()"
      [summary]="summary()"
      [yAxisLabel]="label()"
      [yMin]="0"
      [yMax]="axisMax()"
      [valueFormatter]="formatter()"
      [heightClass]="heightClass()"
    />
  `,
  host: { class: 'block' },
})
export class FormChart {
  public readonly points = input.required<FormChartPoint[]>();
  public readonly yMax = input(1);
  public readonly reference = input<number | null>(null);
  /** '%' plots shares between 0 and 1 as percentages, '' plots plain numbers. */
  public readonly unit = input<'%' | ''>('%');
  public readonly label = input('Forme');
  public readonly referenceLabel = input('Référence');
  /** Tailwind height of the chart box; shorter where the chart shares the screen. */
  public readonly heightClass = input('h-60 w-full sm:h-64');

  private readonly scale = computed(() => (this.unit() === '%' ? 100 : 1));

  /** A day's date under its first match only, so an evening does not repeat '01/10' three times. */
  protected readonly labels = computed(() =>
    this.points().map((p, i, all) => (i > 0 && all[i - 1].label === p.label ? '' : p.label)),
  );
  protected readonly titles = computed(() => this.points().map((p) => p.tooltip));
  protected readonly axisMax = computed(() => this.yMax() * this.scale());

  protected readonly formatter = computed<ChartValueFormatter>(() => {
    const unit = this.unit() === '%' ? ' %' : '';
    return (value) => `${Math.round(value)}${unit}`;
  });

  protected readonly series = computed<ChartSeries[]>(() => {
    const values = this.points().map((p) => p.value * this.scale());
    const rolling = values.map((_, i) => {
      const chunk = values.slice(Math.max(0, i - FORM_ROLLING_WINDOW + 1), i + 1);
      return chunk.reduce((a, b) => a + b, 0) / chunk.length;
    });
    const dots = values.length <= FORM_DOTS_MAX_MATCHES ? FORM_MATCH_DOT_RADIUS : 0;
    const series: ChartSeries[] = [
      {
        label: `Moyenne sur ${FORM_ROLLING_WINDOW} matchs`,
        color: resolveSeriesColor(0),
        points: rolling,
      },
      { label: 'Chaque match', color: FORM_MATCH_COLOR, points: values, pointRadius: dots },
    ];
    const reference = this.reference();
    if (reference !== null) {
      series.push({
        label: this.referenceLabel(),
        color: token('--color-accent-green', '#5fb88a'),
        points: values.map(() => reference * this.scale()),
        dashed: true,
      });
    }
    return series;
  });

  protected readonly summary = computed(() => {
    const values = this.points().map((p) => p.value * this.scale());
    if (!values.length) {
      return '';
    }
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return `${this.label()} sur ${values.length} matchs, moyenne ${this.formatter()(mean)}.`;
  });
}
