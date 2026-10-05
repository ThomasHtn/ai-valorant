import { Component, computed, input } from '@angular/core';

import { signedRounds } from '@core/report/gap.utils';

import { RoundsBar } from './rounds-chart.model';

/**
 * Where the rounds go, at a glance: one bar per situation around a zero axis, losses to the left
 * in red, gains to the right in green, all on the same scale.
 */
@Component({
  selector: 'app-rounds-chart',
  template: `
    <ul class="m-0 grid list-none gap-1.5 p-0" role="list">
      @for (bar of bars(); track bar.key) {
        <li
          class="grid items-center gap-x-3 gap-y-0.5 sm:grid-cols-[13rem_minmax(0,1fr)]"
          [class.opacity-45]="bar.thin"
        >
          <span
            class="truncate font-semibold text-text-secondary sm:text-right"
            [title]="bar.label"
            >{{ bar.label }}</span
          >
          <span class="relative grid h-7 grid-cols-2 items-center px-12">
            <span
              class="absolute inset-y-[-3px] left-1/2 w-px bg-edge-strong"
              aria-hidden="true"
            ></span>
            <span class="flex justify-end">
              @if (bar.rounds < 0) {
                <span
                  class="flex h-5 items-center justify-start bg-accent-red/80"
                  [style.width.%]="bar.width"
                >
                  <b
                    class="-ml-12 w-11 text-right font-display font-bold text-accent-red tabular-nums"
                    >{{ bar.text }}</b
                  >
                </span>
              }
            </span>
            <span class="flex">
              @if (bar.rounds > 0) {
                <span
                  class="flex h-5 items-center justify-end bg-rating-good/80"
                  [style.width.%]="bar.width"
                >
                  <b class="-mr-12 w-11 font-display font-bold text-rating-good tabular-nums">{{
                    bar.text
                  }}</b>
                </span>
              }
            </span>
          </span>
        </li>
      }
    </ul>
    <p class="!m-0 mt-2 grid gap-3 text-sm text-text-muted sm:grid-cols-[13rem_minmax(0,1fr)]">
      <span class="hidden sm:block"></span>
      <span class="grid grid-cols-2 px-12"
        ><span class="pr-3 text-right">rounds perdus face au top ranked</span
        ><span class="pl-3">rounds gagnés</span></span
      >
    </p>
  `,
  host: { class: 'block' },
})
export class RoundsChart {
  public readonly items = input.required<readonly RoundsBar[]>();

  protected readonly bars = computed(() => {
    const max = Math.max(1, ...this.items().map((i) => Math.abs(i.rounds)));
    return this.items().map((i) => ({
      ...i,
      width: (Math.abs(i.rounds) / max) * 100,
      text: signedRounds(i.rounds),
    }));
  });
}
