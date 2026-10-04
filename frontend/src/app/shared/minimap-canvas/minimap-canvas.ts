import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';

import { minimapImage } from '@core/game-assets/minimap.utils';
import { HoverTip } from '@shared/hover-tip/hover-tip';

import {
  CALLOUT_FONT_SIZE,
  DENSITY_BLUR,
  DENSITY_RADIUS_MAX,
  DENSITY_RADIUS_MIN,
  HIGHLIGHT_RADIUS,
  MARKER_RADIUS,
  NAME_FONT_SIZE,
  NAME_OFFSET,
  PLAYER_RADIUS,
} from './minimap-canvas.constants';
import {
  MinimapDensitySpot,
  MinimapHighlight,
  MinimapLabel,
  MinimapMarker,
} from './minimap-canvas.model';
import { markerViews, rotatePoint } from './minimap-canvas.utils';

let canvasCount = 0;

/**
 * A map's minimap with markers drawn over it: points of the Minimap view, players of a 2D replay.
 * Density spots sit under the markers. Positions are fractions of the square image. A marker with a `link` opens it on click or Enter,
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
  public readonly density = input<readonly MinimapDensitySpot[]>([]);
  /** Faint place names. */
  public readonly labels = input<readonly MinimapLabel[]>([]);
  public readonly highlight = input<MinimapHighlight | null>(null);
  /** Clockwise turn of the image in degrees (0, 90, 180, 270); points follow, texts stay upright. */
  public readonly rotation = input(0);

  private readonly router = inject(Router);

  protected readonly image = computed(() => minimapImage(this.map()));
  protected readonly views = computed(() =>
    markerViews(
      this.markers().map((m) => rotatePoint(m, this.rotation())),
      MARKER_RADIUS,
    ),
  );
  protected readonly shownDensity = computed(() =>
    this.density().map((spot) => rotatePoint(spot, this.rotation())),
  );
  protected readonly shownLabels = computed(() =>
    this.labels().map((label) => rotatePoint(label, this.rotation())),
  );
  protected readonly shownHighlight = computed(() => {
    const spot = this.highlight();
    return spot ? rotatePoint(spot, this.rotation()) : null;
  });

  protected readonly r = MARKER_RADIUS;
  protected readonly densityMin = DENSITY_RADIUS_MIN;
  protected readonly densitySpan = DENSITY_RADIUS_MAX - DENSITY_RADIUS_MIN;
  protected readonly densityBlur = DENSITY_BLUR;
  /** Unique per canvas so two canvases on a page never share a filter. */
  protected readonly blurId = `density-blur-${++canvasCount}`;
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
