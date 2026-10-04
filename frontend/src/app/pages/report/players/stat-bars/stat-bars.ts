import { Component, input } from '@angular/core';

import { BetterHint } from '@shared/better-hint/better-hint';
import { InfoTip } from '@shared/info-tip/info-tip';
import { TONE_TEXT_CLASSES } from '@shared/stat-tile/stat-tile.constants';

import { BAR_FILLS, BAR_SEGMENTS_MASK } from './stat-bars.constants';
import { StatBarRow } from './stat-bars.model';
import { referenceLine } from './stat-bars.utils';

/**
 * Figures as attribute gauges: name with the reference and sample written out, a ten-segment bar on
 * the figure's scale with a tick at the reference, and the value in its tone on the right.
 */
@Component({
  selector: 'app-stat-bars',
  imports: [BetterHint, InfoTip],
  template: `
    @for (row of rows(); track row.key) {
      <!-- Name and reference on top, the gauge under them, the value big on the right. -->
      <div
        role="listitem"
        class="row-hover grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 bg-text-primary/4 px-3 py-2.5"
      >
        <span class="flex min-w-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
          <span class="inline-flex min-w-0 items-center gap-1 text-text-secondary"
            >{{ row.label }}<app-better-hint [better]="row.better" [compact]="true" /><app-info-tip
              [topic]="row.help"
          /></span>
          <span class="text-sm text-text-secondary">{{ referenceLine(row) }}</span>
        </span>
        <b
          class="row-span-2 min-w-[4.5rem] text-right font-display text-[1.5rem] leading-none font-semibold tabular-nums"
          [class]="row.tone ? toneText[row.tone] : 'text-text-primary'"
          >{{ row.value }}</b
        >
        @if (row.reach !== null) {
          <span class="relative h-3" aria-hidden="true">
            <span class="absolute inset-0 block bg-text-primary/10" [style.mask-image]="mask">
              <i
                class="absolute inset-y-0 left-0 block"
                [class]="fills[row.tone ?? 'none']"
                [style.width.%]="row.reach * 100"
              ></i>
            </span>
            @if (row.referenceReach !== null) {
              <b
                class="absolute -inset-y-1.5 block w-[3px] -translate-x-1/2 bg-top"
                [style.left.%]="row.referenceReach * 100"
              ></b>
            }
          </span>
        }
      </div>
    }
  `,
  host: { class: 'flex flex-col gap-0.5', role: 'list' },
})
export class StatBars {
  public readonly rows = input.required<StatBarRow[]>();

  protected readonly toneText = TONE_TEXT_CLASSES;
  protected readonly referenceLine = referenceLine;
  protected readonly fills = BAR_FILLS;
  protected readonly mask = BAR_SEGMENTS_MASK;
}
