import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';

import { minimapImage } from '@core/game-assets/minimap.utils';
import { HoverTip } from '@shared/hover-tip/hover-tip';

import {
  CALLOUT_FONT_SIZE,
  HIGHLIGHT_RADIUS,
  MARKER_RADIUS,
  NAME_FONT_SIZE,
  NAME_OFFSET,
  PLAYER_RADIUS,
} from './minimap-canvas.constants';
import { MinimapHighlight, MinimapLabel, MinimapMarker } from './minimap-canvas.model';
import { markerViews } from './minimap-canvas.utils';

/**
 * A map's minimap with markers drawn over it: points of the Minimap view, players of a 2D replay.
 * Positions are fractions of the square image. A marker with a `link` opens it on click or Enter,
 * keeping the period; a marker with a `tip` explains itself on hover.
 */
@Component({
  selector: 'app-minimap-canvas',
  imports: [HoverTip],
  templateUrl: './minimap-canvas.html',
  host: { class: 'relative block aspect-square w-full max-w-full bg-surface-sunken' },
})
export class MinimapCanvas {
  /** Map name, for the image and the alternative text. */
  public readonly map = input.required<string>();
  public readonly markers = input<readonly MinimapMarker[]>([]);
  /** Faint place names. */
  public readonly labels = input<readonly MinimapLabel[]>([]);
  public readonly highlight = input<MinimapHighlight | null>(null);

  private readonly router = inject(Router);

  protected readonly image = computed(() => minimapImage(this.map()));
  protected readonly views = computed(() => markerViews(this.markers(), MARKER_RADIUS));

  protected readonly r = MARKER_RADIUS;
  protected readonly playerR = PLAYER_RADIUS;
  protected readonly highlightR = HIGHLIGHT_RADIUS;
  protected readonly calloutSize = CALLOUT_FONT_SIZE;
  protected readonly nameSize = NAME_FONT_SIZE;
  protected readonly nameOffset = NAME_OFFSET;

  protected open(marker: MinimapMarker): void {
    if (marker.link) {
      void this.router.navigate(marker.link, { queryParamsHandling: 'preserve' });
    }
  }
}
