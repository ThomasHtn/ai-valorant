import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MapThumb } from '@shared/game-art/map-thumb';

/** The period's maps as thumbnails; the open one is underlined in amber. */
@Component({
  selector: 'app-map-picker',
  imports: [MapThumb, RouterLink],
  template: `
    @for (map of maps(); track map) {
      @let active = map === selected();
      <a
        [routerLink]="['/report/minimap', map.toLowerCase()]"
        queryParamsHandling="preserve"
        class="focus-ring-inset flex items-center gap-2 border-b-[3px] py-1 pr-3 pl-1 font-semibold no-underline transition-colors hover:bg-text-primary/7 hover:!text-text-primary"
        [class]="
          active
            ? 'border-brand-500 bg-text-primary/7 !text-text-primary'
            : 'border-transparent bg-text-primary/4 !text-text-secondary'
        "
        [attr.aria-current]="active ? 'page' : null"
      >
        <app-map-thumb [map]="map" />{{ map }}
      </a>
    }
  `,
  host: { class: 'flex flex-wrap gap-0.5', role: 'navigation', 'aria-label': 'Carte' },
})
export class MapPicker {
  public readonly maps = input.required<readonly string[]>();
  public readonly selected = input<string | null>(null);
}
