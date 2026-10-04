import { Component, computed, input } from '@angular/core';

import { formatValue } from '@core/format/value-format.utils';
import { assetSlug } from '@core/game-assets/game-assets.utils';
import { WeaponUse } from '@core/report/players.model';
import { GameArt } from '@core/report/stat-table.model';
import { RowArt } from '@shared/game-art/row-art';
import { InfoTip } from '@shared/info-tip/info-tip';

/**
 * The weapons the player kills most with: kills, share of his kills, headshot rate and median kill
 * distance, each with the same figure for top ranked players of his role underneath.
 */
@Component({
  selector: 'app-weapons-panel',
  imports: [RowArt, InfoTip],
  template: `
    <h3 id="player-weapons" class="!m-0 font-display text-lg font-semibold text-text-primary">
      Armes<app-info-tip topic="playerWeapons" />
    </h3>
    <ul class="!m-0 flex list-none flex-col gap-0.5 !p-0" aria-labelledby="player-weapons">
      <li
        class="grid grid-cols-[4rem_minmax(0,1fr)_repeat(4,4.6rem)] items-center gap-2 bg-text-primary/8 px-2.5 py-1.5 text-sm font-semibold text-text-secondary"
      >
        <span></span><span>Arme</span><span class="text-right">Kills</span
        ><span class="text-right">Part</span><span class="text-right">HS</span
        ><span class="text-right">Distance</span>
      </li>
      @for (row of rows(); track row.weapon) {
        <li
          class="row-hover grid grid-cols-[4rem_minmax(0,1fr)_repeat(4,4.6rem)] items-center gap-2 bg-text-primary/4 px-2.5 py-1.5 tabular-nums"
        >
          <app-row-art [art]="row.art" />
          <span>{{ row.weapon }}</span>
          <span class="text-right">{{ row.kills }}</span>
          @for (figure of row.figures; track $index) {
            <span class="flex flex-col items-end leading-tight">
              <span>{{ figure.player }}</span>
              <span class="text-xs text-text-muted">top {{ figure.top }}</span>
            </span>
          }
        </li>
      }
    </ul>
    <p class="!m-0 text-sm text-text-muted">Top : joueurs du top ranked du même rôle.</p>
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
