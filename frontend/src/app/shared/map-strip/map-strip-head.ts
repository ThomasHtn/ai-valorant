import { Component, input } from '@angular/core';

import { MapThumb } from '@shared/game-art/map-thumb';

/** Header of a per-map strip: each map's thumbnail over its first three letters. */
@Component({
  selector: 'app-map-strip-head',
  imports: [MapThumb],
  template: `
    @for (map of maps(); track map) {
      <span class="flex w-8 flex-col items-center sm:w-9" [title]="map">
        <app-map-thumb class="!h-4 !w-full" [map]="map" />
        <b class="text-[0.7rem] font-medium text-text-muted">{{ map.slice(0, 3) }}</b>
      </span>
    }
  `,
  host: { class: 'mt-1 flex gap-0.5', 'aria-hidden': 'true' },
})
export class MapStripHead {
  public readonly maps = input.required<readonly string[]>();
}
