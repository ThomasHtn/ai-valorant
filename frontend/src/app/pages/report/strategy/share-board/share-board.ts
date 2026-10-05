import { Component, computed, input } from '@angular/core';

import { ColHead } from '@shared/col-head/col-head';
import { GapBar } from '@shared/gap-bar/gap-bar';
import { BAR_TEXTS } from '@shared/gap-bar/gap-bar.constants';

import { ShareRow } from '../strategy.model';

/** Shares of the top ranked beside the squad's (plants by site, defensive contacts by zone), and what was won there. */
@Component({
  selector: 'app-share-board',
  imports: [ColHead, GapBar],
  template: `
    <table class="board board-stack">
      <thead>
        <tr>
          <th appColHead [label]="first()" [help]="help()"></th>
          <th appColHead label="Top ranked" [vs]="shareLabel()"></th>
          <th appColHead label="Escouade" vs="trait blanc : top ranked"></th>
          <th
            appColHead
            [label]="wonLabel()"
            align="end"
            [better]="1"
            vs="escouade, puis top ranked"
          ></th>
        </tr>
      </thead>
      <tbody>
        @for (row of rows(); track row.key) {
          <tr>
            <td class="font-semibold">{{ row.label }}</td>
            <td data-l="Top ranked">
              <app-gap-bar [value]="scaled(row.top)" [label]="row.topText" />
            </td>
            <td data-l="Escouade">
              <app-gap-bar
                [value]="scaled(row.squad)"
                [mark]="scaled(row.top)"
                [tone]="row.squadTone"
                [label]="row.squadText"
              />
            </td>
            <td
              class="num whitespace-nowrap"
              [attr.data-l]="wonLabel()"
              [attr.data-tone]="row.squadWonTone"
            >
              <span class="font-display font-semibold" [class]="texts[row.squadWonTone]">{{
                row.squadWon
              }}</span>
              <span class="ml-1 text-sm text-text-muted">sur {{ row.squadCount }}</span>
              <span class="block text-sm text-text-muted">top {{ row.topWon }}</span>
            </td>
          </tr>
        }
      </tbody>
    </table>
  `,
  host: { class: 'block overflow-x-auto' },
})
export class ShareBoard {
  public readonly rows = input.required<readonly ShareRow[]>();
  public readonly first = input('Site');
  public readonly help = input<string | null>(null);
  public readonly shareLabel = input('part des poses');
  public readonly wonLabel = input('Gagnés');

  protected readonly texts = BAR_TEXTS;
  /** Bars stretch to the largest share of the board, so small shares stay readable. */
  private readonly largest = computed(() =>
    Math.max(0.01, ...this.rows().flatMap((r) => [r.top ?? 0, r.squad ?? 0])),
  );

  protected scaled(share: number | null): number | null {
    return share === null ? null : share / this.largest();
  }
}
