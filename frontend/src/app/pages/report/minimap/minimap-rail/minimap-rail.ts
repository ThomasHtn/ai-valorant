import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideUsers } from '@lucide/angular';

import { Side } from '@core/common/enums.model';
import { SIDE_LABELS } from '@core/format/labels.constants';
import { MetaPlayer } from '@core/report/report-meta.model';
import { AgentIcon } from '@shared/game-art/agent-icon';
import { MapThumb } from '@shared/game-art/map-thumb';

/**
 * Left list of the Minimap: the maps (links, the map lives in the route), the side and the player
 * whose points stand out. Sticky, so another choice never needs a scroll back up.
 */
@Component({
  selector: 'app-minimap-rail',
  imports: [AgentIcon, LucideUsers, MapThumb, RouterLink],
  templateUrl: './minimap-rail.html',
  host: { class: 'side-rail', role: 'navigation', 'aria-label': 'Filtres de la minimap' },
})
export class MinimapRail {
  public readonly maps = input.required<readonly string[]>();
  public readonly selectedMap = input.required<string | null>();
  public readonly side = input.required<Side>();
  public readonly players = input.required<readonly MetaPlayer[]>();
  /** Highlighted player; '' for the whole squad. */
  public readonly player = input.required<string>();

  public readonly sideChange = output<Side>();
  public readonly playerChange = output<string>();

  protected readonly sides: readonly Side[] = ['att', 'def'];
  protected readonly sideLabels = SIDE_LABELS;
}
