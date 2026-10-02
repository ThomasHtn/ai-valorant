import { Component, computed, input } from '@angular/core';

import { weaponIcon } from '@core/game-assets/game-assets.utils';

/** Kill-feed silhouette then name, for a weapon column. */
@Component({
  selector: 'app-weapon-name',
  template: `
    <span class="inline-flex w-16 shrink-0 justify-center">
      @if (src(); as src) {
        <img [src]="src" alt="" loading="lazy" class="h-4 max-w-full object-contain opacity-80" />
      }
    </span>
    {{ weapon() }}
  `,
  host: { class: 'inline-flex items-center gap-2' },
})
export class WeaponName {
  public readonly weapon = input.required<string>();

  protected readonly src = computed(() => weaponIcon(this.weapon()));
}
