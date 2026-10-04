import { Component, computed, input } from '@angular/core';

import { formatValue } from '@core/format/value-format.utils';
import { assetSlug } from '@core/game-assets/game-assets.utils';
import { WeaponUse } from '@core/report/players.model';
import { GameArt } from '@core/report/stat-table.model';
import { RowArt } from '@shared/game-art/row-art';
import { InfoTip } from '@shared/info-tip/info-tip';

/**
 * The weapons the player kills most with: kills, share of his kills, headshot rate and median kill
 * distance, each with the same figure for top ranked players of his role under it.
 */
@Component({
  selector: 'app-weapons-panel',
  imports: [RowArt, InfoTip],
  template: `
    <h3 id="player-weapons" class="!m-0 font-display text-lg font-semibold text-text-primary">
      Armes<app-info-tip topic="playerWeapons" />
    </h3>
    <div class="overflow-x-auto">
      <table class="hover-rows w-full border-separate border-spacing-y-0.5 tabular-nums">
        <thead>
          <tr class="text-sm text-text-secondary">
            <th scope="col" class="bg-text-primary/8 px-2.5 py-2 text-left font-semibold">Arme</th>
            <th scope="col" class="bg-text-primary/8 px-2.5 py-2 text-right font-semibold">
              Kills
            </th>
            <th scope="col" class="bg-text-primary/8 px-2.5 py-2 text-right font-semibold">
              Part de ses kills
            </th>
            <th scope="col" class="bg-text-primary/8 px-2.5 py-2 text-right font-semibold">
              Headshots
            </th>
            <th scope="col" class="bg-text-primary/8 px-2.5 py-2 text-right font-semibold">
              Distance des kills
            </th>
          </tr>
        </thead>
        <tbody>
          @for (row of rows(); track row.weapon) {
            <tr>
              <th scope="row" class="bg-text-primary/4 px-2.5 py-1.5 text-left font-medium">
                <span class="flex items-center gap-3"
                  ><app-row-art [art]="row.art" />{{ row.weapon }}</span
                >
              </th>
              <td class="bg-text-primary/4 px-2.5 py-1.5 text-right font-semibold">
                {{ row.kills }}
              </td>
              @for (figure of row.figures; track $index) {
                <td class="bg-text-primary/4 px-2.5 py-1.5 text-right leading-tight">
                  <span class="block font-semibold">{{ figure.player }}</span>
                  <span class="text-sm whitespace-nowrap text-text-muted"
                    >top ranked {{ figure.top }}</span
                  >
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
    <p class="!m-0 text-sm text-text-muted">
      Sous chaque chiffre, les joueurs du top ranked du même rôle avec la même arme.
    </p>
  `,
  host: { class: 'view-section' },
})
export class WeaponsPanel {
  public readonly weapons = input.required<WeaponUse[]>();

  protected readonly rows = computed(() =>
    this.weapons().map((w) => ({
      weapon: w.weapon,
      art: { type: 'weapon', slug: assetSlug(w.weapon) } satisfies GameArt,
      kills: w.kills,
      figures: [
        { player: formatValue(w.share, 'pct'), top: formatValue(w.topShare, 'pct') },
        { player: formatValue(w.headshotRate, 'pct'), top: formatValue(w.topHeadshotRate, 'pct') },
        { player: formatValue(w.distance, 'm'), top: formatValue(w.topDistance, 'm') },
      ],
    })),
  );
}
