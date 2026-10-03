import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Reference } from '@core/common/enums.model';
import { dayMonth } from '@core/format/format.utils';
import { FormMatch, HeadlineStat } from '@core/report/players.model';
import { InfoTip } from '@shared/info-tip/info-tip';
import { MapThumb } from '@shared/game-art/map-thumb';
import { TONE_TEXT_CLASSES } from '@shared/stat-tile/stat-tile.constants';

import { FORM_CONTEXT_MATCHES } from '../players.constants';
import { formTone, formWindow } from '../players.utils';

/**
 * Form, match by match: one clickable tile per match in chronological order (map, day, ACS coloured
 * against the reference, score and K/D/A), green or red underline for the result. The few matches
 * played just before the period lead the row, pale, for context. A tile opens the match.
 */
@Component({
  selector: 'app-form-tiles',
  imports: [RouterLink, InfoTip, MapThumb],
  template: `
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
      <h2 id="player-form" class="!m-0 text-lg">
        Forme, match par match<app-info-tip topic="playerForm" />
      </h2>
      <span class="ml-auto text-sm text-text-muted"
        >Couleur : ACS du match comparé à la référence. Pâle : matchs juste avant la période.</span
      >
    </div>
    <div
      class="grid grid-cols-[repeat(auto-fill,minmax(5.6rem,1fr))] gap-0.5"
      aria-labelledby="player-form"
      role="list"
    >
      @for (tile of tiles(); track tile.matchId) {
        <a
          role="listitem"
          [routerLink]="['/report/matches', tile.matchId]"
          queryParamsHandling="preserve"
          class="focus-ring-inset flex flex-col gap-0.5 border-b-[3px] bg-text-primary/4 px-1.5 py-1.5 !text-text-primary no-underline transition-colors hover:bg-text-primary/10"
          [class]="tile.classes"
          [title]="tile.title"
          [attr.aria-label]="tile.title"
        >
          <span class="flex items-center gap-1.5 text-xs text-text-secondary">
            <app-map-thumb [map]="tile.mapName" size="sm" />{{ tile.day }}
          </span>
          <span
            class="font-display text-[1.15rem] leading-tight font-semibold tabular-nums"
            [class]="tile.acsClass"
          >
            {{ tile.acs }}
          </span>
          <span class="text-xs text-text-muted">{{ tile.score }} · {{ tile.kda }}</span>
        </a>
      }
    </div>
  `,
  host: { class: 'flex flex-col gap-3' },
})
export class FormTiles {
  public readonly form = input.required<FormMatch[]>();
  /** ACS headline of the player, whose references colour each match. */
  public readonly acs = input<HeadlineStat | undefined>(undefined);
  public readonly reference = input.required<Reference>();
  public readonly colours = input(true);

  protected readonly tiles = computed(() =>
    formWindow(this.form(), FORM_CONTEXT_MATCHES).map((m) => {
      const tone = formTone(m, this.acs(), this.reference(), this.colours());
      const kda = `${m.kills}/${m.deaths}/${m.assists}`;
      return {
        matchId: m.matchId,
        mapName: m.mapName,
        day: dayMonth(m.day),
        acs: Math.round(m.acs),
        acsClass: tone ? TONE_TEXT_CLASSES[tone] : '',
        score: m.score,
        kda,
        classes: `${m.won ? 'border-rating-good' : 'border-rating-bad'} ${m.inPeriod ? '' : 'opacity-55'}`,
        title: `${m.mapName} ${dayMonth(m.day)} : ${m.agent}, ${kda}, ${m.won ? 'victoire' : 'défaite'} ${m.score}`,
      };
    }),
  );
}
