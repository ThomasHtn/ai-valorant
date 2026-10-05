import { Component, input } from '@angular/core';

import { InfoTip } from '@shared/info-tip/info-tip';
import { RingGauge } from '@shared/ring-gauge/ring-gauge';

import { KPI_EDGES } from './kpi-band.constants';
import { KpiItem } from './kpi-band.model';

/**
 * Headline figures as big rings, the value in the middle and a white tick at the reference; each
 * cell carries its colour on its left edge, so the band reads in one glance.
 */
@Component({
  selector: 'app-kpi-band',
  imports: [InfoTip, RingGauge],
  template: `
    <dl class="m-0 grid grid-cols-2 gap-1 sm:grid-cols-[repeat(auto-fit,minmax(10.5rem,1fr))]">
      @for (item of items(); track item.key) {
        <div
          class="flex min-w-0 flex-col items-center gap-2.5 bg-text-primary/4 px-3 pt-3.5 pb-3 text-center"
          [class]="edges[item.tone ?? 'none']"
        >
          <dt
            class="flex items-center gap-1 font-display text-[1.05rem] font-semibold tracking-wide uppercase"
          >
            {{ item.label }}<app-info-tip [topic]="item.help" />
          </dt>
          <dd class="m-0">
            <app-ring-gauge
              class="size-[5.5rem] sm:size-24"
              [value]="item.fraction ?? 0"
              [reference]="item.mark ?? null"
              [tone]="item.tone"
              [label]="item.value + (item.unit ? ' ' + item.unit : '')"
              textClass="text-2xl"
            />
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

  protected readonly edges = KPI_EDGES;
}
