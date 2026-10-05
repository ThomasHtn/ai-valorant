import { Component, input } from '@angular/core';

import { MapThumb } from '@shared/game-art/map-thumb';

/** A map as a row names it: a small thumbnail and its name in capitals, the way the game's map picker writes it. */
@Component({
  selector: 'app-map-label',
  imports: [MapThumb],
  template: `
    <app-map-thumb [map]="map()" />
    <span class="font-display text-[1.05rem] leading-none font-semibold tracking-wide uppercase">{{
      map()
    }}</span>
  `,
  host: { class: 'inline-flex items-center gap-2.5' },
})
export class MapLabel {
  public readonly map = input.required<string>();
}
