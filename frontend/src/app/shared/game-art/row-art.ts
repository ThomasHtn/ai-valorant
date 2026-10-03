import { Component, computed, input } from '@angular/core';

import { artImage } from '@core/game-assets/game-assets.utils';
import { GameArt } from '@core/report/stat-table.model';

import { GAME_ART_FRAME_CLASS } from './game-art.constants';

/**
 * Picture column of a table row: a square map or agent thumbnail, a role icon, or a weapon
 * silhouette. Keeps its box when there is no picture so rows stay aligned. Player art must be
 * resolved to the player's agent beforehand (see `resolveRowArt`).
 */
@Component({
  selector: 'app-row-art',
  template: `
    @if (src(); as src) {
      <img [src]="src" alt="" loading="lazy" [class]="imageClass()" />
    }
  `,
  host: { '[class]': 'hostClass()', 'aria-hidden': 'true' },
})
export class RowArt {
  public readonly art = input<GameArt | null | undefined>(null);

  protected readonly src = computed(() => {
    const art = this.art();
    return art && art.type !== 'player' ? artImage(art.type, art.slug) : null;
  });
  protected readonly hostClass = computed(() =>
    this.art()?.type === 'weapon'
      ? 'inline-grid h-5 w-14 shrink-0 place-items-center'
      : `${GAME_ART_FRAME_CLASS} size-6 ${this.src() ? '' : 'bg-transparent'}`,
  );
  protected readonly imageClass = computed(() =>
    this.art()?.type === 'weapon'
      ? 'max-h-full max-w-full object-contain opacity-90'
      : this.art()?.type === 'role'
        ? 'size-4 object-contain opacity-85'
        : 'size-full object-cover',
  );
}
