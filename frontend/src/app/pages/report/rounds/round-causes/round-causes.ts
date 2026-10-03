import { Component, input, output } from '@angular/core';

import { LossCause } from '@core/common/enums.model';
import { InfoTip } from '@shared/info-tip/info-tip';

import { CauseCount } from '../rounds-filter.model';

/** Lost rounds of the list by cause, as bars; a bar keeps only its rounds, a second click clears it. */
@Component({
  selector: 'app-round-causes',
  imports: [InfoTip],
  templateUrl: './round-causes.html',
  host: { class: 'flex flex-col gap-1.5' },
})
export class RoundCauses {
  public readonly causes = input.required<readonly CauseCount[]>();
  public readonly selected = input<LossCause | ''>('');
  public readonly selectedChange = output<LossCause | ''>();

  protected toggle(cause: LossCause): void {
    this.selectedChange.emit(this.selected() === cause ? '' : cause);
  }
}
