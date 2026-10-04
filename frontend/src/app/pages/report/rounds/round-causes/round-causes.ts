import { Component, computed, input, output } from '@angular/core';

import { LossCause } from '@core/common/enums.model';
import { InfoTip } from '@shared/info-tip/info-tip';

import { CauseCount } from '../rounds-filter.model';

/** Ring radius giving a circumference of 100, so a share in percent is the arc's dash length. */
const RING_RADIUS = 100 / (2 * Math.PI);

/**
 * Lost rounds of the list by cause, as a grid of rings (part of the lost rounds); a ring keeps only
 * its rounds, a second click clears it.
 */
@Component({
  selector: 'app-round-causes',
  imports: [InfoTip],
  templateUrl: './round-causes.html',
  host: { class: 'view-section' },
})
export class RoundCauses {
  public readonly causes = input.required<readonly CauseCount[]>();
  public readonly selected = input<LossCause | ''>('');
  public readonly selectedChange = output<LossCause | ''>();

  protected readonly radius = RING_RADIUS;
  /** Lost rounds the shares are taken from, read back from the first cause. */
  protected readonly lost = computed(() => {
    const first = this.causes()[0];
    return first?.share ? Math.round(first.count / first.share) : 0;
  });
  protected readonly rings = computed(() =>
    this.causes().map((item) => {
      const percent = Math.round(item.share * 100);
      return {
        ...item,
        percent: `${percent} %`,
        dash: `${item.share * 100} ${100 - item.share * 100}`,
        rounds: `${item.count} round${item.count > 1 ? 's' : ''} perdu${item.count > 1 ? 's' : ''}`,
      };
    }),
  );

  protected toggle(cause: LossCause): void {
    this.selectedChange.emit(this.selected() === cause ? '' : cause);
  }
}
