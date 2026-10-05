import { Component, input } from '@angular/core';

/** Header of a per-map strip: each map's first three letters over its column. */
@Component({
  selector: 'app-map-strip-head',
  template: `
    @for (map of maps(); track map) {
      <b
        class="w-8 text-center font-display text-xs font-semibold tracking-wide text-text-secondary uppercase sm:w-9"
        [title]="map"
        >{{ map.slice(0, 3) }}</b
      >
    }
  `,
  host: { class: 'mt-1 flex gap-0.5' },
})
export class MapStripHead {
  public readonly maps = input.required<readonly string[]>();
}
