import { Component, computed, input } from '@angular/core';

import { MapThumb } from '@shared/game-art/map-thumb';
import { HoverTip } from '@shared/hover-tip/hover-tip';

import { RoundsPill } from '../rounds-pill/rounds-pill';
import { DASH_TEXTS } from '../squad.constants';
import { HabitRow } from '../squad.model';
import { HABIT_READING_CLASSES } from './habit-board.constants';

/**
 * Each priority map by map, painted in rounds against the top ranked, then what it reads as: a habit
 * of the squad (red on most maps) or one map's problem.
 */
@Component({
  selector: 'app-habit-board',
  imports: [HoverTip, MapThumb, RoundsPill],
  templateUrl: './habit-board.html',
  host: { class: 'block overflow-x-auto' },
})
export class HabitBoard {
  public readonly rows = input.required<readonly HabitRow[]>();

  protected readonly maps = computed(() => this.rows()[0]?.cells.map((c) => c.map) ?? []);
  protected readonly cols = computed(
    () => `minmax(13rem,1.6fr) repeat(${this.maps().length},minmax(4rem,1fr)) minmax(10rem,1.1fr)`,
  );
  protected readonly tones = DASH_TEXTS;
  protected readonly readings = HABIT_READING_CLASSES;
}
