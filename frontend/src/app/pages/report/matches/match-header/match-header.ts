import { Component, computed, input } from '@angular/core';

import { longDay } from '@core/format/format.utils';
import { mapSplash } from '@core/game-assets/game-assets.utils';
import { MatchDetail } from '@core/report/matches.model';
import { Badge } from '@shared/badge/badge';

import { matchLength, startTime } from '../matches.utils';

/** Banner of a match: the map's loading screen behind its name, the score and the match facts. */
@Component({
  selector: 'app-match-header',
  imports: [Badge],
  template: `
    @let m = match();
    <div
      class="absolute inset-0 bg-cover bg-center"
      [style.background-image]="splash()"
      aria-hidden="true"
    ></div>
    <div
      class="absolute inset-0 bg-linear-to-r from-surface-sunken/92 via-surface-sunken/70 to-surface-sunken/35"
      aria-hidden="true"
    ></div>
    <div class="relative flex w-full flex-wrap items-end gap-x-6 gap-y-2 px-4 py-4">
      <h2 class="!m-0 font-display text-[2rem] leading-none font-semibold uppercase">
        {{ m.mapName }}
      </h2>
      <span
        class="font-display text-[2.6rem] leading-none font-bold"
        [class]="m.won ? 'text-rating-good' : 'text-rating-bad'"
        >{{ m.roundsWon }}-{{ m.roundsLost }}</span
      >
      <span class="flex flex-wrap items-center gap-x-4 gap-y-1 text-text-secondary">
        <app-badge
          [label]="m.won ? 'Victoire' : 'Défaite'"
          [kind]="m.won ? 'good' : 'bad'"
          size="sm"
        />
        <span>{{ longDay(m.day) }} à {{ startTime(m.startedAt) }}</span>
        <span class="inline-flex items-center gap-1.5"
          >Départ en
          <app-badge
            [label]="m.startSide === 'att' ? 'attaque' : 'défense'"
            [kind]="m.startSide === 'att' ? 'attack' : 'defense'"
            size="sm"
        /></span>
        <span>Patch {{ m.patch }}</span>
        <span>{{ matchLength(m.lengthMs) }}</span>
        @if (m.cluster) {
          <span>Serveur {{ m.cluster }}</span>
        }
      </span>
    </div>
  `,
  host: { class: 'relative flex min-h-30 items-end overflow-hidden' },
})
export class MatchHeader {
  public readonly match = input.required<MatchDetail>();

  protected readonly splash = computed(() => {
    const src = mapSplash(this.match().mapName);
    return src ? `url('${src}')` : null;
  });
  protected readonly longDay = longDay;
  protected readonly startTime = startTime;
  protected readonly matchLength = matchLength;
}
