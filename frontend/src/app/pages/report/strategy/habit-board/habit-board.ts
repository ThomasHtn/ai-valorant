import { Component, input } from '@angular/core';

import { ColHead } from '@shared/col-head/col-head';
import { BAR_FILLS, BAR_TEXTS } from '@shared/gap-bar/gap-bar.constants';

import { HabitRow } from '../strategy.model';

/**
 * The habits that explain the top ranked's extra rounds: their share beside the squad's, drawn as a
 * dumbbell (white ring: top ranked, dot: squad), then what it costs per match.
 */
@Component({
  selector: 'app-habit-board',
  imports: [ColHead],
  template: `
    <table class="board board-stack">
      <thead>
        <tr>
          <th appColHead label="Habitude"></th>
          <th appColHead label="Top ranked" align="end"></th>
          <th appColHead label="Escouade" align="end"></th>
          <th appColHead label="Écart" vs="cercle : top ranked, point : escouade"></th>
          <th
            appColHead
            label="Coût estimé"
            align="end"
            [better]="1"
            help="habitCost"
            vs="rounds par match"
          ></th>
        </tr>
      </thead>
      <tbody>
        @for (row of rows(); track row.key) {
          <tr [class.is-thin]="row.thin">
            <td>
              <span class="flex flex-col leading-tight">
                <span class="font-semibold">{{ row.label }}</span>
                <small class="text-sm text-text-muted">{{ row.effect }}</small>
              </span>
            </td>
            <td class="num font-display font-semibold" data-l="Top ranked">{{ row.top }}</td>
            <td class="num font-display font-semibold" data-l="Escouade" [class]="texts[row.tone]">
              {{ row.squad }}
            </td>
            <td class="min-w-40" data-l="Écart">
              <span class="relative block h-4 w-full min-w-32" aria-hidden="true">
                <span
                  class="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-surface-sunken/70"
                ></span>
                @if (row.topShare !== null && row.squadShare !== null) {
                  <span
                    class="absolute top-1/2 h-1 -translate-y-1/2 opacity-55"
                    [class]="fills[row.tone]"
                    [style.left.%]="min(row) * 100"
                    [style.width.%]="(max(row) - min(row)) * 100"
                  ></span>
                  <span
                    class="absolute top-1/2 size-3 -translate-1/2 rounded-full"
                    [class]="fills[row.tone]"
                    [style.left.%]="row.squadShare * 100"
                  ></span>
                }
                @if (row.topShare !== null) {
                  <span
                    class="absolute top-1/2 size-3 -translate-1/2 rounded-full border-2 border-text-primary bg-surface-950"
                    [style.left.%]="row.topShare * 100"
                  ></span>
                }
              </span>
            </td>
            <td class="num whitespace-nowrap" data-l="Coût estimé" [attr.data-tone]="row.tone">
              <span class="font-display text-lg font-bold" [class]="texts[row.tone]">{{
                row.cost
              }}</span>
              <small class="ml-1 text-sm text-text-muted">par match</small>
            </td>
          </tr>
        }
      </tbody>
    </table>
  `,
  host: { class: 'block overflow-x-auto' },
})
export class HabitBoard {
  public readonly rows = input.required<readonly HabitRow[]>();

  protected readonly texts = BAR_TEXTS;
  protected readonly fills = BAR_FILLS;

  protected min(row: HabitRow): number {
    return Math.min(row.topShare ?? 0, row.squadShare ?? 0);
  }

  protected max(row: HabitRow): number {
    return Math.max(row.topShare ?? 0, row.squadShare ?? 0);
  }
}
