import { Component, computed, input } from '@angular/core';

import { StatTable } from '@core/report/stat-table.model';
import { MapThumb } from '@shared/game-art/map-thumb';
import { HoverTip } from '@shared/hover-tip/hover-tip';

import { halfWidth, mapBars, MAP_BAR_SCALE_POINTS } from './map-bars.utils';

/**
 * Maps of the Résumé as bars around the even line: green to the right when the squad wins more
 * rounds than it loses there, red to the left otherwise, with the record and the score gap.
 */
@Component({
  selector: 'app-map-bars',
  imports: [HoverTip, MapThumb],
  template: `
    <div
      class="grid grid-cols-[minmax(0,9.5rem)_3rem_minmax(0,1fr)_3rem_auto] items-center gap-x-3 px-3 pb-1 text-sm text-text-muted"
    >
      <span>Carte</span>
      <span class="text-center">V-D</span>
      <span class="flex justify-between"
        ><span>Moins de 50 %</span><span>Rounds gagnés</span><span>Plus de 50 %</span></span
      >
      <span></span>
      <span class="text-right">Écart au score</span>
    </div>
    <ul class="!m-0 flex list-none flex-col gap-0.5 !p-0">
      @for (bar of bars(); track bar.key) {
        <li
          class="grid cursor-default grid-cols-[minmax(0,9.5rem)_3rem_minmax(0,1fr)_3rem_auto] items-center gap-x-3 px-3 py-1.5 transition-colors hover:bg-text-primary/9"
          [class]="bar.total ? 'bg-text-primary/8 font-semibold' : 'bg-text-primary/4'"
          tabindex="0"
          [appHoverTip]="bar.tip"
        >
          <span class="flex min-w-0 items-center gap-2.5">
            @if (bar.total) {
              <span class="size-6 shrink-0" aria-hidden="true"></span>
            } @else {
              <app-map-thumb class="!size-6" [map]="bar.label" [decorative]="true" />
            }
            <span class="truncate">{{ bar.label }}</span>
          </span>
          <span class="text-center font-semibold tabular-nums">
            <span class="text-rating-good">{{ bar.wins }}</span
            ><span class="text-text-muted">-</span
            ><span class="text-rating-bad">{{ bar.losses }}</span>
          </span>
          <!-- Two halves around the even line: losses grow left, wins grow right. -->
          <span class="relative grid h-3 grid-cols-2" aria-hidden="true">
            <span class="relative bg-text-primary/6">
              @if (bar.points < 0) {
                <i
                  class="absolute inset-y-0 right-0 block bg-rating-bad"
                  [style.width.%]="width(bar.points)"
                ></i>
              }
            </span>
            <span class="relative bg-text-primary/6">
              @if (bar.points > 0) {
                <i
                  class="absolute inset-y-0 left-0 block bg-rating-good"
                  [style.width.%]="width(bar.points)"
                ></i>
              }
            </span>
            <i class="absolute inset-y-[-3px] left-1/2 block w-px bg-text-primary/60"></i>
          </span>
          <span
            class="text-right font-semibold tabular-nums"
            [class]="
              bar.points > 0
                ? 'text-rating-good'
                : bar.points < 0
                  ? 'text-rating-bad'
                  : 'text-text-primary'
            "
            >{{ bar.rate }}</span
          >
          <span
            class="text-right text-sm whitespace-nowrap tabular-nums"
            [class]="
              bar.diffSign > 0
                ? 'text-rating-good'
                : bar.diffSign < 0
                  ? 'text-rating-bad'
                  : 'text-text-secondary'
            "
            >{{ bar.diff }}</span
          >
        </li>
      }
    </ul>
    <p class="!m-0 pt-1.5 text-sm text-text-muted">
      Barre pleine : {{ scale }} points au-dessus ou en dessous de 50 %. Survol : le détail et
      l'escouade avant la période.
    </p>
  `,
  host: { class: 'block' },
})
export class MapBars {
  public readonly table = input.required<StatTable>();
  /** 'Avant septembre', the name of the squad's history in the tips. */
  public readonly historyName = input.required<string>();

  protected readonly bars = computed(() => mapBars(this.table(), this.historyName()));
  protected readonly width = halfWidth;
  protected readonly scale = MAP_BAR_SCALE_POINTS;
}
