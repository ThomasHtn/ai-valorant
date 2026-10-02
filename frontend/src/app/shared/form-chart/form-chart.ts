import { Component, computed, input } from '@angular/core';

import { resolveSeriesColor, token } from '@shared/chart/chart-theme.utils';
import { ChartSeries, ChartValueFormatter } from '@shared/chart/chart.model';
import { LineChart } from '@shared/chart/line-chart';

import { FORM_MATCH_COLOR, FORM_ROLLING_WINDOW } from './form-chart.constants';
import { FormChartPoint } from './form-chart.model';

/**
 * Form over the period, on ValoQuests' line chart: each match as a faint curve, the rolling average
 * in amber over it, and a dashed reference (50 %, or top ranked players' level).
 */
@Component({
  selector: 'app-form-chart',
  imports: [LineChart],
  template: `
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

  protected readonly labels = computed(() => this.points().map((p) => p.label));
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
    const series: ChartSeries[] = [
      { label: 'Moyenne sur 5 matchs', color: resolveSeriesColor(0), points: rolling },
      { label: 'Match', color: FORM_MATCH_COLOR, points: values },
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
