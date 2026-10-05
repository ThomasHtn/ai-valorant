import { Component, computed, input } from '@angular/core';

import { mapBanner } from '@core/game-assets/game-assets.utils';

/** A map's wide strip with its name over a dark fade, as the game's map picker shows it. */
@Component({
  selector: 'app-map-banner',
  template: `
    <span
      class="absolute inset-0 bg-linear-to-r from-surface-sunken/90 to-surface-sunken/15"
      aria-hidden="true"
    ></span>
    <span class="relative font-display font-semibold tracking-wide uppercase">{{ map() }}</span>
  `,
  host: {
    class:
      'relative flex h-9 w-36 shrink-0 items-center overflow-hidden bg-surface-700 bg-cover bg-center px-2.5 sm:w-40',
    '[style.background-image]': 'image()',
  },
})
export class MapBanner {
  public readonly map = input.required<string>();

  protected readonly image = computed(() => {
    const src = mapBanner(this.map());
    return src ? `url('${src}')` : null;
  });
}
