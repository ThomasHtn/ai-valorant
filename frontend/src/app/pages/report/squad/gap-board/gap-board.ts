import { Component, computed, input } from '@angular/core';

import { GapBar } from '@shared/gap-bar/gap-bar';
import { ColHead } from '@shared/col-head/col-head';
import { MapThumb } from '@shared/game-art/map-thumb';
import { MapStrip } from '@shared/map-strip/map-strip';
import { MapStripHead } from '@shared/map-strip/map-strip-head';
import { BAR_TEXTS } from '@shared/gap-bar/gap-bar.constants';

import { GapRow } from '../squad.model';
import { gapCells } from '../squad.utils';

/**
 * Lines of situations (or buys, or sites) against the top ranked: real volume, rate bar with the
 * top ranked tick, gap in rounds; optionally per match and map by map.
 */
@Component({
  selector: 'app-gap-board',
  imports: [ColHead, GapBar, MapStrip, MapStripHead, MapThumb],
  templateUrl: './gap-board.html',
  host: { class: 'block overflow-x-auto' },
})
export class GapBoard {
  public readonly rows = input.required<readonly GapRow[]>();
  /** Name of the first column: 'Situation', 'Achat', 'Site'. */
  public readonly first = input('Situation');
  /** Matches of the period: shows the gap per match when set. */
  public readonly matches = input(0);
  /** Maps of the per-map strip, in order; no strip when empty. */
  public readonly maps = input<readonly string[]>([]);

  protected readonly lines = computed(() =>
    this.rows().map((row) => ({ row, cells: gapCells(row.gap, this.matches()) })),
  );
  protected readonly tones = BAR_TEXTS;
}
