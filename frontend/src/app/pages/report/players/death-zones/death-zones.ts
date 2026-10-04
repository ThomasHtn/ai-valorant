import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { dayMonth } from '@core/format/format.utils';
import { integer } from '@core/format/value-format.utils';
import { DeathZone } from '@core/report/players.model';
import { roundLink } from '@core/report/round-ref.utils';
import { InfoTip } from '@shared/info-tip/info-tip';
import { MapThumb } from '@shared/game-art/map-thumb';

import { ZONE_ROUND_LINKS } from '../players.constants';
import { isZoneTooDeadly, zoneRateLine } from '../players.utils';

/**
 * Where the player dies most: zone and map, deaths and first deaths there, how often per 100 rounds
 * beside top ranked of his role (red when clearly more), and the rounds to rewatch.
 */
@Component({
  selector: 'app-death-zones',
  imports: [RouterLink, InfoTip, MapThumb],
  template: `
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
      <h3 id="player-zones" class="!m-0 font-display text-lg font-semibold text-text-primary">
        Où il meurt<app-info-tip topic="playerDeathZones" />
      </h3>
      <a class="ml-auto" routerLink="/report/minimap" queryParamsHandling="preserve"
        >Voir sur la minimap</a
      >
    </div>
    <ul class="!m-0 grid list-none gap-0.5 !p-0 xl:grid-cols-2" aria-labelledby="player-zones">
      @for (zone of zones(); track zone.key) {
        <li
          class="row-hover grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 border-l-[3px] bg-text-primary/4 px-3 py-2.5"
          [class]="zone.tooDeadly ? 'border-rating-bad' : 'border-transparent'"
        >
          <app-map-thumb class="row-span-3" [map]="zone.mapName" size="md" />
          <span class="flex flex-wrap items-baseline gap-x-2">
            <b class="font-display text-[1.05rem] font-semibold">{{ zone.zone }}</b>
            <span class="text-text-muted">{{ zone.mapName }}</span>
            <span class="ml-auto text-text-secondary">{{ zone.deathsLine }}</span>
          </span>
          @if (zone.rate) {
            <span
              class="text-sm"
              [class]="zone.tooDeadly ? 'text-rating-bad' : 'text-text-muted'"
              >{{ zone.rate }}</span
            >
          }
          <span class="flex flex-wrap items-center gap-1 text-sm">
            @for (round of zone.links; track round.label) {
              <a
                class="bg-text-primary/8 px-1.5 tabular-nums no-underline hover:bg-text-primary/15"
                [routerLink]="round.link"
                queryParamsHandling="preserve"
                [title]="'Revoir le round ' + round.label"
                >{{ round.label }}</a
              >
            }
            @if (zone.more) {
              <span class="text-text-muted">et {{ zone.more }} autres</span>
            }
          </span>
        </li>
      }
    </ul>
  `,
  host: { class: 'view-section' },
})
export class DeathZones {
  public readonly deathZones = input.required<DeathZone[]>();

  protected readonly zones = computed(() =>
    this.deathZones().map((z) => ({
      key: `${z.mapName}:${z.zone}`,
      mapName: z.mapName,
      zone: z.zone,
      deathsLine:
        `${integer(z.deaths)} mort${z.deaths > 1 ? 's' : ''} ici` +
        (z.firstDeaths
          ? `, dont ${integer(z.firstDeaths)} first death${z.firstDeaths > 1 ? 's' : ''}`
          : ''),
      rate: zoneRateLine(z),
      tooDeadly: isZoneTooDeadly(z),
      links: z.rounds.slice(0, ZONE_ROUND_LINKS).map((r) => ({
        label: `${dayMonth(r.startedAt)} R${r.roundNumber}`,
        link: roundLink(r),
      })),
      more: Math.max(0, z.rounds.length - ZONE_ROUND_LINKS),
    })),
  );
}
