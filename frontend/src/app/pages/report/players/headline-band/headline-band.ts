import { Component, computed, input } from '@angular/core';

import { Reference } from '@core/common/enums.model';
import { HeadlineStat } from '@core/report/players.model';
import { StatTile } from '@shared/stat-tile/stat-tile';

import { headlineTiles } from '../players.utils';

/**
 * Headline figures of a player: ACS, K/D, ADR, KAST, then four figures of his role (sent by the API),
 * each coloured against the chosen reference with that reference and the sample written under it.
 */
@Component({
  selector: 'app-headline-band',
  imports: [StatTile],
  template: `
    <div class="grid grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))] gap-0.5">
      @for (tile of tiles(); track tile.key) {
        <app-stat-tile
          [label]="tile.label"
          [value]="tile.value"
          [tone]="tile.tone"
          [lines]="tile.lines"
          [help]="tile.help"
        />
      }
    </div>
    <p class="!m-0 text-sm text-text-muted">
      Les quatre derniers chiffres dépendent du rôle ({{ roleLabel().toLowerCase() }}). Top ranked :
      joueurs du même rôle. Adversaires : joueurs adverses du même rôle dans vos matchs. Historique
      : le joueur avant la période.
    </p>
  `,
  host: { class: 'flex flex-col gap-2' },
})
export class HeadlineBand {
  public readonly headline = input.required<HeadlineStat[]>();
  public readonly reference = input.required<Reference>();
  public readonly colours = input(true);
  /** French role of the player, for the reference note. */
  public readonly roleLabel = input.required<string>();

  protected readonly tiles = computed(() =>
    headlineTiles(this.headline(), this.reference(), this.colours()),
  );
}
