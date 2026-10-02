import { Component, input } from '@angular/core';

import { decimal, percentOf } from '@core/format/format.utils';
import { MapPlayerRow } from '@core/periods/map-sheet.model';
import { AgentName } from '@shared/game-art/agent-name';
import { InfoTip } from '@shared/info-tip/info-tip';
import { RatingAgainstClassPipe, RatingClassPipe } from '@shared/rating/rating-class.pipe';

/** Each squad player on one map. */
@Component({
  selector: 'app-map-players',
  imports: [RatingClassPipe, RatingAgainstClassPipe, InfoTip, AgentName],
  template: `
    <div class="table-scroll">
      <table class="data-table">
        <tr>
          <th>Joueur</th>
          <th>Agent principal</th>
          <th class="num">Matchs</th>
          <th class="num">ACS <app-info-tip topic="acs" /></th>
          <th class="num">K/D <app-info-tip topic="kd" /></th>
          <th class="num">ADR <app-info-tip topic="adr" /></th>
          <th class="num">KAST <app-info-tip topic="kast" /></th>
          <th class="num">FB-FD <app-info-tip topic="fbfd" /></th>
          <th class="num">Impact <app-info-tip topic="impact" /></th>
        </tr>
        @for (p of players(); track p.name) {
          <tr>
            <td>{{ p.name }}</td>
            <td><app-agent-name [agent]="p.mainAgent" /></td>
            <td class="num">{{ p.matches }}</td>
            <td class="num" [class]="p.acs | ratingClass: 'acs'">{{ decimal(p.acs) }}</td>
            <td class="num" [class]="p.kd | ratingClass: 'kd'">{{ decimal(p.kd, 2) }}</td>
            <td class="num" [class]="p.adr | ratingClass: 'adr'">{{ decimal(p.adr) }}</td>
            <td class="num" [class]="p.kast | ratingClass: 'kast'">{{ percentOf(p.kast) }}</td>
            <td class="num" [class]="p.firstBloods | ratingAgainstClass: p.firstDeaths : 0">
              {{ p.firstBloods }}-{{ p.firstDeaths }}
            </td>
            <td class="num font-semibold" [class]="p.impact | ratingClass: 'impact'">
              {{ decimal(p.impact, 1, true) }}
            </td>
          </tr>
        }
      </table>
    </div>
  `,
})
export class MapPlayers {
  public readonly players = input.required<MapPlayerRow[]>();

  protected readonly decimal = decimal;
  protected readonly percentOf = percentOf;
}
