import { Component, computed, input } from '@angular/core';

import { clock } from '@core/format/format.utils';
import { sideBadge } from '@core/periods/finding-format.utils';
import { CostlyRound } from '@core/sessions/session.model';
import { Badge } from '@shared/badge/badge';
import { KillSnapshot } from '@shared/kill-snapshot/kill-snapshot';

/** Above this chance the round is described as almost won. */
const ALMOST_WON = 0.95;
const STEP_LABELS = { death: 'Mort', kill: 'Kill', plant: 'Plant' } as const;

/** A round lost after the squad was clearly favoured: why it matters, what went wrong, how it unfolded. */
@Component({
  selector: 'app-costly-round',
  imports: [Badge, KillSnapshot],
  templateUrl: './costly-round.html',
  host: { class: 'panel my-3 flex flex-wrap gap-4' },
})
export class CostlyRoundCard {
  public readonly round = input.required<CostlyRound>();

  protected readonly odds = computed(() => {
    const chance = this.round().bestChance;
    return chance >= ALMOST_WON
      ? 'le round était presque gagné'
      : `environ ${Math.round(10 * chance)} chances sur 10 de le gagner`;
  });

  protected readonly clock = clock;
  protected readonly side = computed(() => sideBadge(this.round().side));
  protected readonly stepLabels = STEP_LABELS;
}
