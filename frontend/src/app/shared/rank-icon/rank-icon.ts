import { Component, computed, input } from '@angular/core';

import { parseRank, rankIcon } from '@core/game-assets/rank.utils';

/** Size of the icon: `sm` inside a row, `lg` in a player header. */
export type RankIconSize = 'sm' | 'lg';

const ICON_SIZES: Record<RankIconSize, string> = { sm: 'size-5', lg: 'size-10' };

/**
 * A rank as the game shows it: its tier icon then its French name ('Platine 1'). Accepts Henrik's
 * English names; anything else is written as is ('Rang inconnu' when empty).
 */
@Component({
  selector: 'app-rank-icon',
  template: `
    @if (rank(); as r) {
      <img [src]="src()" alt="" [class]="iconClass()" />
      <span>{{ r.label }}</span>
    } @else {
      <span class="text-text-muted">{{ name() || 'Rang inconnu' }}</span>
    }
  `,
  host: {
    class: 'inline-flex items-center gap-1.5 whitespace-nowrap',
    '[class.font-semibold]': "size() === 'lg'",
  },
})
export class RankIcon {
  /** English or French rank name, e.g. 'Platinum 1'. */
  public readonly name = input<string | null | undefined>(null);
  public readonly size = input<RankIconSize>('sm');

  protected readonly rank = computed(() => parseRank(this.name()));
  protected readonly src = computed(() => {
    const rank = this.rank();
    return rank ? rankIcon(rank) : '';
  });
  protected readonly iconClass = computed(
    () => `${ICON_SIZES[this.size()]} shrink-0 object-contain`,
  );
}
