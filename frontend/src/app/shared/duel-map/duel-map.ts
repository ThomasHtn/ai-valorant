import { Component, input } from '@angular/core';

import { DuelMap as DuelMapData } from '@core/common/common.model';

/** Size of the SVG coordinate space; the image scales with its container. */
const SIZE = 300;

/** Minimap with opening duels: first bloods (green, at the killer) and first deaths (red, at the victim). */
@Component({
  selector: 'app-duel-map',
  template: `
    <svg
      [attr.viewBox]="'0 0 ' + size + ' ' + size"
      role="img"
      class="w-full bg-surface-sunken"
      [attr.aria-label]="'Premiers duels sur ' + duels().mapName"
    >
      <image
        [attr.href]="duels().minimapUrl"
        x="0"
        y="0"
        [attr.width]="size"
        [attr.height]="size"
        opacity="0.7"
      />
      @for (point of duels().lost; track $index) {
        <circle [attr.cx]="point.x * size" [attr.cy]="point.y * size" r="4" class="fill-danger" />
      }
      @for (point of duels().won; track $index) {
        <circle [attr.cx]="point.x * size" [attr.cy]="point.y * size" r="4" class="fill-success" />
      }
    </svg>
  `,
})
export class DuelMap {
  public readonly duels = input.required<DuelMapData>();

  protected readonly size = SIZE;
}
