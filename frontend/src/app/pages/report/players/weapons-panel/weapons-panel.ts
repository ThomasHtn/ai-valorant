import { Component, computed, input } from '@angular/core';

import { formatValue } from '@core/format/value-format.utils';
import { assetSlug } from '@core/game-assets/game-assets.utils';
import { WeaponUse } from '@core/report/players.model';
import { GameArt } from '@core/report/stat-table.model';
import { RowArt } from '@shared/game-art/row-art';
import { InfoTip } from '@shared/info-tip/info-tip';

/** The weapons the player kills most with: kills and share, headshot rate, median kill distance. */
@Component({
  selector: 'app-weapons-panel',
  imports: [RowArt, InfoTip],
  template: `
    <h3 id="player-weapons" class="!m-0 font-display text-lg font-semibold text-text-primary">
      Armes<app-info-tip topic="playerWeapons" />
    </h3>
    <ul class="!m-0 flex list-none flex-col gap-0.5 !p-0" aria-labelledby="player-weapons">
      <li
        class="grid grid-cols-[4rem_minmax(0,1fr)_repeat(3,4.6rem)] items-center gap-2 bg-text-primary/8 px-2.5 py-1.5 text-sm font-semibold text-text-secondary"
      >
        <span></span><span>Arme</span><span class="text-right">Kills</span
        ><span class="text-right">HS</span><span class="text-right">Distance</span>
      </li>
      @for (row of rows(); track row.weapon) {
        <li
          class="row-hover grid grid-cols-[4rem_minmax(0,1fr)_repeat(3,4.6rem)] items-center gap-2 bg-text-primary/4 px-2.5 py-1.5 tabular-nums"
        >
          <app-row-art [art]="row.art" />
          <span>{{ row.weapon }}</span>
          <span class="text-right"
            >{{ row.kills }} <span class="text-text-muted">{{ row.share }}</span></span
          >
          <span class="text-right">{{ row.headshots }}</span>
          <span class="text-right">{{ row.distance }}</span>
        </li>
      }
    </ul>
  `,
  host: { class: 'flex flex-col gap-1.5' },
})
export class WeaponsPanel {
  public readonly weapons = input.required<WeaponUse[]>();

  protected readonly rows = computed(() =>
    this.weapons().map((w) => ({
      weapon: w.weapon,
      art: { type: 'weapon', slug: assetSlug(w.weapon) } satisfies GameArt,
      kills: w.kills,
      share: formatValue(w.share, 'pct'),
      headshots: formatValue(w.headshotRate, 'pct'),
      distance: formatValue(w.distance, 'm'),
    })),
  );
}
