import { Component, computed, input } from '@angular/core';

import { MarkerShape } from '@shared/minimap-canvas/minimap-canvas.model';
import { crossPath, diamondPath, trianglePath } from '@shared/minimap-canvas/minimap-canvas.utils';

/** Legend symbol of a layer: its marker shape and colour at icon size. */
@Component({
  selector: 'app-layer-symbol',
  template: `
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      @switch (shape()) {
        @case ('dot') {
          <circle cx="7" cy="7" r="4.5" [attr.fill]="color()" />
        }
        @case ('ring') {
          <circle cx="7" cy="7" r="4" fill="none" [attr.stroke]="color()" stroke-width="1.6" />
        }
        @case ('thickRing') {
          <circle cx="7" cy="7" r="4.5" fill="none" [attr.stroke]="color()" stroke-width="2.4" />
        }
        @case ('cross') {
          <path [attr.d]="path()" [attr.stroke]="color()" stroke-width="2" fill="none" />
        }
        @default {
          <path [attr.d]="path()" [attr.fill]="color()" />
        }
      }
    </svg>
  `,
  host: { class: 'inline-flex shrink-0' },
})
export class LayerSymbol {
  public readonly shape = input.required<MarkerShape>();
  public readonly color = input.required<string>();

  protected readonly path = computed(() => {
    switch (this.shape()) {
      case 'diamond':
        return diamondPath(7, 7, 4.2);
      case 'triangle':
        return trianglePath(7, 7, 4.5);
      case 'cross':
        return crossPath(7, 7, 4);
      default:
        return '';
    }
  });
}
