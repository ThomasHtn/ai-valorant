import {
  afterNextRender,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { Chart, ChartConfiguration } from 'chart.js';

import { AXIS_TICK_FONT, CHART_LOCALE } from './chart-theme.constants';
import {
  axisTitleOptions,
  chartPixelRatio,
  chartTooltipOptions,
  prefersReducedMotion,
  registerChartComponents,
  resolveChartTheme,
} from './chart-theme.utils';
import { ChartGroupSeries, ChartValueFormatter } from './chart.model';

/**
 * Several cohorts side by side on each category (the squad, its opponents, top ranked players),
 * in the same furniture as `app-bar-chart`. The legend is drawn in HTML under the plot.
 */
@Component({
  selector: 'app-grouped-bar-chart',
  templateUrl: './grouped-bar-chart.html',
  host: { class: 'block' },
})
export class GroupedBarChart {
  public readonly categories = input.required<readonly string[]>();
  public readonly series = input.required<readonly ChartGroupSeries[]>();
  public readonly ariaLabel = input.required<string>();
  /** Prose standing in for the plot, read out to assistive technology. */
  public readonly summary = input('');
  public readonly valueFormatter = input<ChartValueFormatter | null>(null);
  public readonly yAxisLabel = input('');
  public readonly yMax = input<number | null>(null);
  public readonly heightClass = input('h-56 w-full sm:h-64');

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private chart: Chart<'bar'> | null = null;
  private readonly theme = resolveChartTheme();

  constructor() {
    registerChartComponents();

    afterNextRender(() => {
      this.chart = new Chart(this.canvas().nativeElement, this.configuration());
      // The grid around the canvas settles after the first build; one resize repaints it sharp.
      requestAnimationFrame(() => this.chart?.resize());
    });

    effect(() => {
      const labels = [...this.categories()];
      const datasets = this.datasets();
      if (!this.chart) {
        return;
      }
      this.chart.data.labels = labels;
      this.chart.data.datasets = datasets;
      this.chart.update('none');
    });

    inject(DestroyRef).onDestroy(() => this.chart?.destroy());
  }

  private datasets(): ChartConfiguration<'bar'>['data']['datasets'] {
    return this.series().map((series) => ({
      label: series.label,
      data: [...series.values],
      backgroundColor: series.color,
      borderWidth: 0,
      borderRadius: { topLeft: 3, topRight: 3, bottomLeft: 0, bottomRight: 0 },
      maxBarThickness: 32,
      categoryPercentage: 0.72,
      barPercentage: 0.9,
    }));
  }

  private configuration(): ChartConfiguration<'bar'> {
    const theme = this.theme;
    return {
      type: 'bar',
      data: { labels: [...this.categories()], datasets: this.datasets() },
      options: {
        locale: CHART_LOCALE,
        responsive: true,
        maintainAspectRatio: false,
        devicePixelRatio: chartPixelRatio(),
        animation: prefersReducedMotion() ? false : { duration: 400 },
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            grid: { display: false },
            border: { color: theme.grid },
            ticks: { color: theme.tick, maxRotation: 0, autoSkip: false, font: AXIS_TICK_FONT },
          },
          y: {
            beginAtZero: true,
            max: this.yMax() ?? undefined,
            grid: { color: theme.grid },
            border: { display: false },
            title: axisTitleOptions(theme, this.yAxisLabel()),
            ticks: { color: theme.tick, maxTicksLimit: 5, font: AXIS_TICK_FONT },
          },
        },
        plugins: {
          tooltip: {
            ...chartTooltipOptions(theme),
            displayColors: true,
            boxPadding: 4,
            callbacks: {
              label: (item) => {
                const series = this.series()[item.datasetIndex];
                const detail = series?.details?.[item.dataIndex];
                const value = this.formatValue(item.parsed.y ?? 0);
                return `${item.dataset.label} : ${value}${detail ? ` (${detail})` : ''}`;
              },
            },
          },
        },
      },
    };
  }

  private formatValue(value: number): string {
    const formatter = this.valueFormatter();
    return formatter
      ? formatter(value)
      : new Intl.NumberFormat(CHART_LOCALE, { maximumFractionDigits: 1 }).format(value);
  }
}
