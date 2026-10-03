import { Component, computed, input } from '@angular/core';

import { integer } from '@core/format/value-format.utils';
import { PlayerSheet } from '@core/report/players.model';
import { AgentIcon } from '@shared/game-art/agent-icon';
import { RoleIcon } from '@shared/game-art/role-icon';
import { RankIcon } from '@shared/rank-icon/rank-icon';

import { AgentsStrip } from '../agents-strip/agents-strip';
import { roleLabel } from '../players.utils';

/** Who the sheet is about: avatar agent, name, role and rank with their icons, volume, agents played. */
@Component({
  selector: 'app-player-header',
  imports: [AgentIcon, RankIcon, AgentsStrip, RoleIcon],
  template: `
    <app-agent-icon [agent]="sheet().portrait" size="lg" [decorative]="true" />
    <div class="flex flex-col gap-1">
      <h2 class="!m-0 text-[1.7rem] font-semibold">{{ sheet().name }}</h2>
      <p class="!m-0 flex flex-wrap items-center gap-x-4 gap-y-1 text-text-secondary">
        <span class="inline-flex items-center gap-1.5"
          ><app-role-icon class="!size-5" [role]="sheet().role" />{{ role() }}</span
        >
        <app-rank-icon [name]="sheet().rank" size="lg" />
        <span
          ><b class="text-text-primary">{{ sheet().matches }}</b> matchs</span
        >
        <span
          ><b class="text-text-primary">{{ rounds() }}</b> rounds</span
        >
      </p>
    </div>
    <app-agents-strip class="sm:ml-auto" [agents]="sheet().agents" />
  `,
  host: { class: 'flex flex-wrap items-center gap-x-5 gap-y-2.5' },
})
export class PlayerHeader {
  public readonly sheet = input.required<PlayerSheet>();

  protected readonly role = computed(() => roleLabel(this.sheet().role));
  protected readonly rounds = computed(() => integer(this.sheet().rounds));
}
