import { Component, computed, input } from '@angular/core';

import { EconomyLine } from '@core/report/rounds.model';
import { AgentIcon } from '@shared/game-art/agent-icon';
import { HoverTip } from '@shared/hover-tip/hover-tip';

import { teamLoadout } from './round-loadouts.utils';

/** Weapons recap of a round: each team's buy, one short line per player, credits left in the tip. */
@Component({
  selector: 'app-round-loadouts',
  imports: [AgentIcon, HoverTip],
  templateUrl: './round-loadouts.html',
  host: { class: 'grid gap-x-6 gap-y-4 lg:grid-cols-2' },
})
export class RoundLoadouts {
  public readonly squad = input.required<readonly EconomyLine[]>();
  public readonly opponents = input.required<readonly EconomyLine[]>();

  protected readonly teams = computed(() => [
    teamLoadout("L'escouade", this.squad()),
    teamLoadout('Adversaires', this.opponents()),
  ]);
}
