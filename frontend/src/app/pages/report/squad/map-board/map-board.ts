import { Component, computed, input } from '@angular/core';

import { mapBanner } from '@core/game-assets/game-assets.utils';
import { MapReference } from '@core/report/report-meta.model';
import { MapLine as ApiMapLine } from '@core/report/squad.model';

import { HoverTip } from '@shared/hover-tip/hover-tip';
import { InfoTip } from '@shared/info-tip/info-tip';

import { RoundsPill } from '../rounds-pill/rounds-pill';
import { DASH_TEXTS, VERDICTS } from '../squad.constants';
import { DUMBBELL, MAP_COLUMNS, MAP_MIN_WIDTH, SIDE_COLORS } from './map-board.constants';
import { dumbbellX, mapLines, sideTotals } from './map-board.utils';

/**
 * Maps of the pool the squad played: attack and defense totals as two tiles, then one line per map
 * with its record, each side against the top ranked, both sides on a dumbbell, the gap and a verdict.
 */
@Component({
  selector: 'app-map-board',
  imports: [HoverTip, InfoTip, RoundsPill],
  templateUrl: './map-board.html',
  host: { class: 'flex flex-col gap-3.5' },
})
export class MapBoard {
  public readonly maps = input.required<readonly ApiMapLine[]>();
  public readonly references = input<readonly MapReference[]>([]);

  protected readonly lines = computed(() => mapLines(this.maps(), this.references()));
  protected readonly sides = computed(() => {
    const totals = sideTotals(this.maps());
    return [
      { key: 'attack', label: 'Attaque', color: SIDE_COLORS.attack, cells: totals.attack },
      { key: 'defense', label: 'Défense', color: SIDE_COLORS.defense, cells: totals.defense },
    ];
  });

  protected readonly tones = DASH_TEXTS;
  protected readonly verdicts = VERDICTS;
  protected readonly colors = SIDE_COLORS;
  protected readonly cols = MAP_COLUMNS;
  protected readonly minWidth = MAP_MIN_WIDTH;
  protected readonly box = DUMBBELL;
  protected readonly mid = dumbbellX(0.5);
  protected readonly x = dumbbellX;
  protected readonly banner = mapBanner;
}
