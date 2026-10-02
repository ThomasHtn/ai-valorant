import { Component, computed, input } from '@angular/core';

import { ClutchRow } from '@core/periods/team.model';
import { ChartValueFormatter } from '@shared/chart/chart.model';
import { cohortSeries } from '@shared/chart/cohort-series.utils';
import { GroupedBarChart } from '@shared/chart/grouped-bar-chart';

const SITUATIONS = ['1v1', '1v2', '1v3', '1v4 et plus'];

/** Clutch success by number of opponents, for the squad, its opponents and top ranked players. */
@Component({
  selector: 'app-clutches',
  imports: [GroupedBarChart],
  template: `
    <p class="caption">
      Part des clutchs gagnés selon le nombre d'adversaires en face. Survoler une barre pour le
      nombre de clutchs.
    </p>
    <section class="bg-text-primary/4 p-5 sm:p-6">
      <app-grouped-bar-chart
        [categories]="situations"
        [series]="series()"
        [valueFormatter]="percentFormatter"
        [summary]="summary()"
        ariaLabel="Clutchs gagnés"
        yAxisLabel="Clutchs gagnés (%)"
      />
    </section>
  `,
})
export class Clutches {
  public readonly rows = input.required<ClutchRow[]>();

  protected readonly situations = SITUATIONS;
  protected readonly percentFormatter: ChartValueFormatter = (value) => `${Math.round(value)} %`;

  /** Top ranked samples are huge, so their counts are left out of the tooltip. */
  protected readonly series = computed(() =>
    this.rows().map((row) => cohortSeries(row.cohort, row.versus, row.cohort !== 'top')),
  );

  protected readonly summary = computed(() =>
    this.series()
      .map(
        (s) =>
          `${s.label} : ` +
          s.values
            .map((v, i) => `${SITUATIONS[i]} ${v === null ? '-' : Math.round(v) + ' %'}`)
            .join(', '),
      )
      .join('. '),
  );
}
