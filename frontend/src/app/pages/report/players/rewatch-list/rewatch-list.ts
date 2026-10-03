import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { dayMonth } from '@core/format/format.utils';
import { SIDE_LABELS } from '@core/format/labels.constants';
import { formatValue } from '@core/format/value-format.utils';
import { RewatchRound } from '@core/report/players.model';
import { roundLink } from '@core/report/round-ref.utils';
import { InfoTip } from '@shared/info-tip/info-tip';
import { MapThumb } from '@shared/game-art/map-thumb';

/** The player's latest first deaths without revenge: each opens its round sheet. */
@Component({
  selector: 'app-rewatch-list',
  imports: [RouterLink, InfoTip, MapThumb],
  template: `
    <h2 id="player-rewatch" class="!m-0 text-lg">
      First deaths sans revenge à revoir<app-info-tip topic="playerRewatch" />
    </h2>
    <ul class="!m-0 flex list-none flex-col gap-0.5 !p-0" aria-labelledby="player-rewatch">
      @for (row of rows(); track row.key) {
        <li>
          <a
            [routerLink]="row.link"
            queryParamsHandling="preserve"
            class="focus-ring-inset grid grid-cols-[1.75rem_5.5rem_minmax(0,1fr)] items-center gap-2.5 bg-text-primary/4 px-2.5 py-2 !text-text-primary no-underline transition-colors hover:bg-text-primary/7"
          >
            <app-map-thumb [map]="row.mapName" size="sm" />
            <span class="tabular-nums">{{ row.when }}</span>
            <span>{{ row.what }}</span>
          </a>
        </li>
      }
    </ul>
  `,
  host: { class: 'flex flex-col gap-3' },
})
export class RewatchList {
  public readonly rounds = input.required<RewatchRound[]>();

  protected readonly rows = computed(() =>
    this.rounds().map((r) => ({
      key: `${r.matchId}:${r.roundNumber}`,
      link: roundLink(r),
      mapName: r.mapName,
      when: `${dayMonth(r.startedAt)} R${r.roundNumber}`,
      what: [
        r.zone,
        SIDE_LABELS[r.side].toLowerCase(),
        formatValue(r.seconds, 'sec'),
        `tué par ${r.killerAgent ?? '?'}${r.weapon ? ` (${r.weapon})` : ''}`,
      ].join(' · '),
    })),
  );
}
