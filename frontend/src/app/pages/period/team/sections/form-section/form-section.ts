import { Component, computed, input } from '@angular/core';

import { dayMonth } from '@core/format/format.utils';
import { FormPoint } from '@core/periods/team.model';
import { FormChart } from '@shared/form-chart/form-chart';

/** Share of rounds won in each match, with a rolling average. */
@Component({
  selector: 'app-form-section',
  imports: [FormChart],
  template: `
    <p class="caption">
      Rounds gagnés à chaque match (courbe claire), moyenne sur 5 matchs (ambre).
    </p>
    <app-form-chart
      [points]="points()"
      [reference]="0.5"
      label="Rounds gagnés (%)"
      referenceLabel="Équilibre (50 %)"
      [heightClass]="heightClass()"
    />
  `,
})
export class FormSection {
  public readonly form = input.required<FormPoint[]>();
  public readonly heightClass = input('h-60 w-full sm:h-64');

  protected readonly points = computed(() =>
    this.form().map((m) => ({
      label: dayMonth(m.startedAt),
      value: m.roundsWon / (m.roundsWon + m.roundsLost),
      tooltip: `${dayMonth(m.startedAt)} · ${m.mapName} · ${m.roundsWon}-${m.roundsLost}`,
    })),
  );
}
