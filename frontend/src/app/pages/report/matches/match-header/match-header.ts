import { Component, computed, input } from '@angular/core';
import { LucideShield, LucideSwords } from '@lucide/angular';

import { longDay } from '@core/format/format.utils';
import { mapSplash } from '@core/game-assets/game-assets.utils';
import { MatchDetail } from '@core/report/matches.model';

import { matchLength, startTime } from '../matches.utils';
import { halfScores } from './match-header.utils';

/** Banner of a match: map name, score and the score of each half, the map's art shown whole. */
@Component({
  selector: 'app-match-header',
  imports: [LucideShield, LucideSwords],
  templateUrl: './match-header.html',
  host: { class: 'relative flex items-stretch justify-between overflow-hidden' },
})
export class MatchHeader {
  public readonly match = input.required<MatchDetail>();

  protected readonly splash = computed(() => mapSplash(this.match().mapName));
  protected readonly halves = computed(() => halfScores(this.match().rounds));
  protected readonly longDay = longDay;
  protected readonly startTime = startTime;
  protected readonly matchLength = matchLength;
}
