import { Component, input } from '@angular/core';

import { ColHead } from '@shared/col-head/col-head';
import { GapBar } from '@shared/gap-bar/gap-bar';
import { BAR_TEXTS } from '@shared/gap-bar/gap-bar.constants';

import { SituationLine } from './player-situations.model';

/**
 * A player's situations against the top ranked of his role: each gap in its own unit (duels,
 * deaths, clutches), then what it costs in rounds, the costliest first.
 */
@Component({
  selector: 'app-player-situations',
  imports: [ColHead, GapBar],
  template: `
    <table class="board board-stack">
      <thead>
        <tr>
          <th appColHead label="Situation"></th>
          <th appColHead label="Volume" align="end"></th>
          <th appColHead label="Taux" vs="trait blanc : top ranked du rôle"></th>
          <th appColHead label="Écart" align="end" help="gapRounds"></th>
          <th
            appColHead
            label="Coût"
            align="end"
            [better]="1"
            help="playerCost"
            vs="en rounds"
          ></th>
        </tr>
      </thead>
      <tbody>
        @for (line of lines(); track line.key) {
          <tr [class.is-thin]="line.thin">
            <td>
              <span class="flex flex-col leading-tight">
                <span class="font-semibold">{{ line.label }}</span>
                <small class="text-sm text-text-muted">{{ line.detail }}</small>
              </span>
            </td>
            <td class="num whitespace-nowrap" data-l="Volume">{{ line.volume }}</td>
            <td data-l="Taux">
              <app-gap-bar
                [value]="line.rate"
                [mark]="line.top"
                [tone]="line.tone"
                [label]="line.rateText"
              />
            </td>
            <td
              class="num whitespace-nowrap font-semibold"
              data-l="Écart"
              [class]="texts[line.tone]"
            >
              {{ line.gap }}
            </td>
            <td class="num whitespace-nowrap" data-l="Coût" [attr.data-tone]="line.tone">
              <span class="font-display text-lg font-bold" [class]="texts[line.tone]">{{
                line.cost
              }}</span>
              <small class="ml-1 text-sm text-text-muted">rounds</small>
            </td>
          </tr>
        }
      </tbody>
    </table>
  `,
  host: { class: 'block overflow-x-auto' },
})
export class PlayerSituations {
  public readonly lines = input.required<readonly SituationLine[]>();

  protected readonly texts = BAR_TEXTS;
}
