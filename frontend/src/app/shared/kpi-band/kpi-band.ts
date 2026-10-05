import { Component, input } from '@angular/core';

import { InfoTip } from '@shared/info-tip/info-tip';
import { RingGauge } from '@shared/ring-gauge/ring-gauge';
import { BAR_TEXTS } from '@shared/gap-bar/gap-bar.constants';

import { KpiItem } from './kpi-band.model';

/** Headline figures side by side in one framed band, each with its ring against the reference. */
@Component({
  selector: 'app-kpi-band',
  imports: [InfoTip, RingGauge],
  template: `
    <dl
      class="m-0 grid grid-cols-2 border border-edge bg-text-primary/3 sm:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]"
    >
      @for (item of items(); track item.key) {
        <div class="-mr-px -mb-px min-w-0 border-r border-b border-edge px-3 py-3 sm:px-4">
          <dt class="flex items-center gap-1 font-semibold text-text-secondary">
            {{ item.label }}<app-info-tip [topic]="item.help" />
          </dt>
          <dd class="m-0 mt-2 flex items-center gap-2.5">
            @if (item.fraction !== undefined && item.fraction !== null) {
              <app-ring-gauge
                class="size-9"
                [value]="item.fraction"
                [reference]="item.mark ?? null"
                [tone]="item.tone"
              />
            }
            <span
              class="font-display text-2xl leading-none font-semibold tabular-nums sm:text-[1.85rem]"
              [class]="item.tone ? tones[item.tone] : 'text-text-primary'"
              >{{ item.value }}
              @if (item.unit) {
                <small class="ml-0.5 text-[0.55em]">{{ item.unit }}</small>
              }
            </span>
          </dd>
          <dd class="m-0 mt-1.5 text-sm text-text-muted">{{ item.sub }}</dd>
        </div>
      }
    </dl>
  `,
  host: { class: 'block' },
})
export class KpiBand {
  public readonly items = input.required<readonly KpiItem[]>();

  protected readonly tones = BAR_TEXTS;
}
