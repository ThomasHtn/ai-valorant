import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { roundLabel } from '@core/format/format.utils';
import { DeathZone } from '@core/report/players.model';
import { roundLink } from '@core/report/round-ref.utils';
import { InfoTip } from '@shared/info-tip/info-tip';
import { MapThumb } from '@shared/game-art/map-thumb';

import { ZONE_ROUND_LINKS } from '../players.constants';

/** Where the player dies most: zone and map, deaths and first deaths, and the rounds to rewatch. */
@Component({
  selector: 'app-death-zones',
  imports: [RouterLink, InfoTip, MapThumb],
  template: `
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
      <h3
        id="player-zones"
        class="!m-0 font-display text-[1.05rem] font-semibold text-text-primary"
      >
        Où il meurt<app-info-tip topic="playerDeathZones" />
      </h3>
      <a class="ml-auto" routerLink="/report/minimap" queryParamsHandling="preserve"
        >Voir sur la minimap</a
      >
    </div>
    <ul class="!m-0 flex list-none flex-col gap-0.5 !p-0" aria-labelledby="player-zones">
      @for (zone of zones(); track zone.key) {
        <li
          class="grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1 bg-text-primary/4 px-2.5 py-2"
        >
          <app-map-thumb [map]="zone.mapName" size="sm" />
          <span class="flex flex-wrap gap-x-1.5">
            <b>{{ zone.zone }}</b
            ><span class="text-text-muted">{{ zone.mapName }}</span>
          </span>
          <span class="text-right whitespace-nowrap tabular-nums">
            {{ zone.deaths }} morts
            @if (zone.firstDeaths) {
              · <span class="text-rating-bad">{{ zone.firstDeaths }} FD</span>
            }
          </span>
          <span class="col-start-2 col-end-4 text-[0.88rem]">
            @for (round of zone.links; track round.label; let last = $last) {
              <a [routerLink]="round.link" queryParamsHandling="preserve">{{ round.label }}</a
              >{{ last ? '' : ', ' }}
            }
            @if (zone.more) {
              <span class="text-text-muted"> +{{ zone.more }}</span>
            }
          </span>
        </li>
      }
    </ul>
  `,
  host: { class: 'flex flex-col gap-3 bg-text-primary/4 p-4' },
})
export class DeathZones {
  public readonly deathZones = input.required<DeathZone[]>();

  protected readonly zones = computed(() =>
    this.deathZones().map((z) => ({
      key: `${z.mapName}:${z.zone}`,
      mapName: z.mapName,
      zone: z.zone,
      deaths: z.deaths,
      firstDeaths: z.firstDeaths,
      links: z.rounds.slice(0, ZONE_ROUND_LINKS).map((r) => ({
        label: roundLabel(r.startedAt, r.mapName, r.roundNumber),
        link: roundLink(r),
      })),
      more: Math.max(0, z.rounds.length - ZONE_ROUND_LINKS),
    })),
  );
}
