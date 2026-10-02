import { Component, computed, input } from '@angular/core';

import { mapSplash } from '@core/game-assets/game-assets.utils';

import { GAME_ART_FRAME_CLASS, MAP_THUMB_SIZES } from './game-art.constants';
import { GameArtSize } from './game-art.model';

/** Square preview of a map (its loading screen, cropped), or its initial when no image is known. */
@Component({
  selector: 'app-map-thumb',
  template: `
    @if (src(); as src) {
      <img
        [src]="src"
        [alt]="decorative() ? '' : map()"
        loading="lazy"
        class="size-full object-cover"
      />
    } @else {
      <span
        class="font-display text-sm font-semibold text-text-secondary"
        [attr.aria-hidden]="decorative()"
        >{{ map().charAt(0) }}</span
      >
    }
  `,
  host: { '[class]': 'hostClass()' },
})
export class MapThumb {
  public readonly map = input.required<string>();
  public readonly size = input<GameArtSize>('sm');
  /** True when the map's name is written next to the thumbnail. */
  public readonly decorative = input(true);

  protected readonly src = computed(() => mapSplash(this.map()));
  protected readonly hostClass = computed(
    () => `${GAME_ART_FRAME_CLASS} ${MAP_THUMB_SIZES[this.size()]}`,
  );
}
