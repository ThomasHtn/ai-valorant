import { Component, input } from '@angular/core';

import { GameArtSize } from './game-art.model';
import { MapThumb } from './map-thumb';

/** Square preview then name, for a map column or a scope tag. */
@Component({
  selector: 'app-map-name',
  imports: [MapThumb],
  template: `<app-map-thumb [map]="map()" [size]="size()" />{{ map() }}`,
  host: { class: 'inline-flex items-center gap-2.5' },
})
export class MapName {
  public readonly map = input.required<string>();
  public readonly size = input<GameArtSize>('sm');
}
