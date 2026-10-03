import { Component, computed, input } from '@angular/core';

import { RoundStripCell } from '@core/report/matches.model';
import { InfoTip } from '@shared/info-tip/info-tip';

import { lossCauseCounts } from '../matches.utils';

/** Lost rounds of a match by computed cause, as bars, most frequent first. */
@Component({
  selector: 'app-loss-causes',
  imports: [InfoTip],
  template: `
    <h2 class="!m-0 text-lg" id="loss-causes-title">
      Rounds perdus par cause<app-info-tip topic="lossCause" />
    </h2>
    <p class="!m-0 text-[0.92rem] text-text-muted">{{ lost() }} rounds perdus</p>
    @if (causes().length) {
      <ul class="m-0 flex list-none flex-col gap-0.5 p-0">
        @for (item of causes(); track item.label) {
          <li
            class="grid grid-cols-[11rem_1fr_2rem] items-center gap-2.5 bg-text-primary/4 px-2.5 py-1"
          >
            <span>{{ item.label }}</span>
            <span
              ><span class="block h-2 bg-rating-bad" [style.width.%]="item.share * 100"></span
            ></span>
            <b class="text-right">{{ item.count }}</b>
          </li>
        }
      </ul>
    } @else {
      <p class="!m-0 text-text-muted">Aucun round perdu.</p>
    }
  `,
  host: {
    class: 'flex max-w-160 flex-col gap-3 bg-text-primary/4 px-4 py-4',
    role: 'region',
    'aria-labelledby': 'loss-causes-title',
  },
})
export class LossCauses {
  public readonly rounds = input.required<readonly RoundStripCell[]>();

  protected readonly causes = computed(() => lossCauseCounts(this.rounds()));
  protected readonly lost = computed(() => this.rounds().filter((r) => !r.won).length);
}
