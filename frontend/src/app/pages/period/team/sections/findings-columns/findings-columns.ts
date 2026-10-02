import { Component, input } from '@angular/core';

import { Finding } from '@core/periods/findings.model';
import { FindingList } from '@shared/point-card/finding-list';

/** Team findings on the left, player findings on the right; an empty side is left out. */
@Component({
  selector: 'app-findings-columns',
  imports: [FindingList],
  template: `
    @if (team().length || players().length) {
      <div class="columns">
        @if (team().length) {
          <div>
            <h3 class="!mt-0">Équipe</h3>
            <app-finding-list [findings]="team()" />
          </div>
        }
        @if (players().length) {
          <div>
            <h3 class="!mt-0">Joueurs</h3>
            <app-finding-list [findings]="players()" subject="player" />
          </div>
        }
      </div>
    } @else {
      <p class="muted">{{ empty() }}</p>
    }
  `,
  host: { class: 'block' },
})
export class FindingsColumns {
  public readonly team = input.required<Finding[]>();
  public readonly players = input.required<Finding[]>();
  /** Said once when neither the team nor a player has anything here. */
  public readonly empty = input('Rien de net sur cette période.');
}
