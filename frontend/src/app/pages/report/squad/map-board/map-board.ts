import { Component, input } from '@angular/core';

import { ColHead } from '@shared/col-head/col-head';
import { GapBar } from '@shared/gap-bar/gap-bar';
import { BAR_TEXTS } from '@shared/gap-bar/gap-bar.constants';
import { MapBanner } from '@shared/map-banner/map-banner';

import { VERDICTS } from '../squad.constants';
import { MapRow } from '../squad.model';

/** Maps of the pool the squad played: attack and defense against the top ranked, gap and where to practise. */
@Component({
  selector: 'app-map-board',
  imports: [ColHead, GapBar, MapBanner],
  template: `
    <table class="board board-stack">
      <thead>
        <tr>
          <th appColHead label="Carte"></th>
          <th appColHead label="Matchs" align="end"></th>
          <th appColHead label="Attaque" [better]="1" vs="rounds gagnés, trait : top ranked"></th>
          <th appColHead label="Défense" [better]="1" vs="rounds gagnés, trait : top ranked"></th>
          <th
            appColHead
            label="Écart"
            align="end"
            [better]="1"
            help="gapRounds"
            vs="en rounds"
          ></th>
          <th appColHead label="Verdict" help="mapVerdict"></th>
        </tr>
      </thead>
      <tbody>
        @for (row of rows(); track row.map) {
          <tr [class.is-thin]="row.thin">
            <td><app-map-banner [map]="row.map" /></td>
            <td class="num whitespace-nowrap" data-l="Matchs">
              {{ row.matches }}<span class="ml-1.5 text-sm text-text-muted">{{ row.record }}</span>
            </td>
            <td data-l="Attaque">
              <app-gap-bar
                [value]="row.attack.rate"
                [mark]="row.attack.top"
                [tone]="row.attack.tone"
                [label]="row.attack.rateText"
              />
            </td>
            <td data-l="Défense">
              <app-gap-bar
                [value]="row.defense.rate"
                [mark]="row.defense.top"
                [tone]="row.defense.tone"
                [label]="row.defense.rateText"
              />
            </td>
            <td class="num" data-l="Écart">
              <span class="font-display text-lg font-bold" [class]="tones[row.roundsTone]">{{
                row.rounds
              }}</span>
            </td>
            <td data-l="Verdict">
              <span
                class="inline-flex items-center rounded-[3px] bg-current/14 px-2 py-0.5 text-sm font-semibold whitespace-nowrap"
                [class]="verdicts[row.verdict].tone"
                >{{ verdicts[row.verdict].label }}</span
              >
            </td>
          </tr>
        }
      </tbody>
    </table>
  `,
  host: { class: 'block overflow-x-auto' },
})
export class MapBoard {
  public readonly rows = input.required<readonly MapRow[]>();

  protected readonly tones = BAR_TEXTS;
  protected readonly verdicts = VERDICTS;
}
