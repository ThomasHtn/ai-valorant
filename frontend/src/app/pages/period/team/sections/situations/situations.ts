import { Component, computed, input } from '@angular/core';

import { Situations as SituationsData } from '@core/periods/team.model';
import { GapList } from '@shared/gap-list/gap-list';

import { situationLines } from './situation-lines.utils';

/** Rounds won after each numbers situation, throws and comebacks included, the costliest first. */
@Component({
  selector: 'app-situations',
  imports: [GapList],
  template: `
    <p class="caption !mt-0">
      Rounds gagnés quand le round est passé au moins une fois par ce rapport de force.
    </p>
    <app-gap-list class="max-w-4xl" [lines]="lines()" />
  `,
  host: { class: 'mt-6 block' },
})
export class Situations {
  public readonly situations = input.required<SituationsData>();

  protected readonly lines = computed(() => situationLines(this.situations()));
}
