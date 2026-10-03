import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EveningMatches } from '@core/report/matches.model';
import { longDay } from '@core/format/format.utils';
import { Badge } from '@shared/badge/badge';
import { MapThumb } from '@shared/game-art/map-thumb';

/** The latest evening of the period: one tile per match (map, score, result), each opening the match. */
@Component({
  selector: 'app-last-evening',
  imports: [RouterLink, Badge, MapThumb],
  template: `
    <p class="!m-0 flex items-center gap-2 text-text-secondary">
      {{ longDay(evening().day) }}
      <app-badge
        [label]="evening().wins + 'V - ' + evening().losses + 'D'"
        [kind]="evening().wins >= evening().losses ? 'good' : 'bad'"
        size="sm"
      />
    </p>
    <ul class="!m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-0.5 !p-0">
      @for (match of evening().matches; track match.matchId) {
        <li>
          <a
            [routerLink]="['/report/matches', match.matchId]"
            queryParamsHandling="preserve"
            class="focus-ring-inset flex items-center gap-2.5 border-b-[3px] bg-text-primary/4 px-2 py-2 !text-text-primary no-underline transition-colors hover:bg-text-primary/7"
            [class]="match.won ? 'border-rating-good' : 'border-rating-bad'"
          >
            <app-map-thumb [map]="match.mapName" size="md" />
            <span class="flex flex-col leading-tight">
              <span>{{ match.mapName }}</span>
              <span
                class="font-display text-lg font-semibold tabular-nums"
                [class]="match.won ? 'text-rating-good' : 'text-rating-bad'"
                >{{ match.roundsWon }}-{{ match.roundsLost }}</span
              >
            </span>
          </a>
        </li>
      }
    </ul>
  `,
  host: { class: 'flex flex-col gap-2' },
})
export class LastEvening {
  public readonly evening = input.required<EveningMatches>();

  protected readonly longDay = longDay;
}
