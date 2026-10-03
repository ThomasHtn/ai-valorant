import { Component, computed, input, output } from '@angular/core';

import { RoundEvent } from '@core/report/rounds.model';

import { KeyMoment } from '../round-moments.model';

import { CHART_SIZE } from './win-probability-chart.constants';
import { chartModel } from './win-probability-chart.utils';

/**
 * The squad's chance of winning the round after each event, as a step line drawn to scale. A point
 * selects its event (the replay and the timeline follow); a vertical line marks the key moment.
 */
@Component({
  selector: 'app-win-probability-chart',
  templateUrl: './win-probability-chart.html',
  host: { class: 'block' },
})
export class WinProbabilityChart {
  public readonly events = input.required<readonly RoundEvent[]>();
  /** Index of the selected event. */
  public readonly step = input(0);
  public readonly keyMoment = input<KeyMoment | null>(null);
  public readonly stepChange = output<number>();

  protected readonly size = CHART_SIZE;
  protected readonly model = computed(() =>
    chartModel(this.events(), this.step(), this.keyMoment()),
  );
}
