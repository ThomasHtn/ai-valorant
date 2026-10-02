import { Component, input } from '@angular/core';

import { Finding } from '@core/periods/findings.model';
import { FindingList } from '@shared/point-card/finding-list';

/** Team findings on the left, player findings on the right. */
@Component({
  selector: 'app-findings-columns',
  imports: [FindingList],
  template: `
    <div>
      <h3 class="!mt-0">Équipe</h3>
      <app-finding-list [findings]="team()" />
    </div>
    <div>
      <h3 class="!mt-0">Joueurs</h3>
      <app-finding-list [findings]="players()" subject="player" />
    </div>
  `,
  host: { class: 'columns' },
})
export class FindingsColumns {
  public readonly team = input.required<Finding[]>();
  public readonly players = input.required<Finding[]>();
}
