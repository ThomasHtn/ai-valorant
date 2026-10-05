import { Component, computed, input } from '@angular/core';

import { Situation, SiteLine } from '@core/report/squad.model';
import { MapThumb } from '@shared/game-art/map-thumb';
import { HoverTip } from '@shared/hover-tip/hover-tip';
import { RingGauge } from '@shared/ring-gauge/ring-gauge';

import { RoundsPill } from '../rounds-pill/rounds-pill';
import { DASH_RINGS, DASH_TEXTS, SITES } from '../squad.constants';
import { SITE_COLUMNS } from './spike-board.constants';
import { siteMapLines, spikeHead } from './spike-board.utils';

/**
 * Post-plant or retakes: the title and its sentence, a big ring in the corner (white tick at the top
 * ranked rate), then one line
 * per map with a painted cell per site and the whole map's gap; samples sit in the tips.
 */
@Component({
  selector: 'app-spike-board',
  imports: [HoverTip, MapThumb, RingGauge, RoundsPill],
  templateUrl: './spike-board.html',
  host: { class: 'flex flex-col gap-3.5' },
})
export class SpikeBoard {
  public readonly situation = input.required<Situation>();
  public readonly sites = input.required<readonly SiteLine[]>();
  public readonly title = input.required<string>();
  /** Who planted, before the figures: "Spike posé par l'escouade". */
  public readonly lead = input.required<string>();
  public readonly headingId = input.required<string>();

  protected readonly head = computed(() => spikeHead(this.situation()));
  protected readonly lines = computed(() => siteMapLines(this.situation(), this.sites()));
  protected readonly letters = SITES;
  protected readonly tones = DASH_TEXTS;
  protected readonly rings = DASH_RINGS;
  protected readonly cols = SITE_COLUMNS;
}
