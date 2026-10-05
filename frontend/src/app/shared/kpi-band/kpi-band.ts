import { Component, input } from '@angular/core';

import { InfoTip } from '@shared/info-tip/info-tip';
import { RingGauge } from '@shared/ring-gauge/ring-gauge';
import { RING_TONE_TEXTS } from '@shared/ring-gauge/ring-gauge.constants';

import { KpiItem } from './kpi-band.model';

/**
 * Headline figures on one framed band split by hairlines: each cell reads label, a small ring beside
 * the big figure (white tick at the reference, colour = verdict), then what the figure rests on.
 */
@Component({
  selector: 'app-kpi-band',
  imports: [InfoTip, RingGauge],
  template: `
    <dl
      class="m-0 grid grid-cols-2 border border-edge bg-text-primary/3 sm:grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]"
    >
      @for (item of items(); track item.key) {
        <div
          class="-mr-px -mb-px flex min-w-0 flex-col gap-2 border-r border-b border-edge px-5 py-4"
        >
          <dt class="flex items-center gap-1 font-semibold text-text-secondary">
            {{ item.label }}<app-info-tip [topic]="item.help" />
          </dt>
          <dd class="m-0 flex items-center gap-3">
            @if (item.fraction !== undefined && item.fraction !== null) {
              <app-ring-gauge
                class="size-10"
                [value]="item.fraction"
                [reference]="item.mark ?? null"
                [tone]="item.tone"
                [width]="6"
              />
            }
            <span
              class="flex items-baseline gap-0.5 font-display leading-none font-semibold tabular-nums"
              [class]="tones[item.tone ?? 'none']"
            >
              <b class="text-[2.25rem] font-semibold">{{ item.value }}</b>
              @if (item.unit) {
                <small class="text-lg">{{ item.unit }}</small>
              }
            </span>
          </dd>
          <dd class="m-0 text-sm leading-snug text-text-muted">{{ item.sub }}</dd>
        </div>
      }
    </dl>
  `,
  host: { class: 'block' },
})
export class KpiBand {
  public readonly items = input.required<readonly KpiItem[]>();

  protected readonly tones = RING_TONE_TEXTS;
}
