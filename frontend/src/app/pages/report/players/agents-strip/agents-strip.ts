import { Component, input } from '@angular/core';

import { AgentPlayed } from '@core/report/players.model';
import { AgentIcon } from '@shared/game-art/agent-icon';

/** Agents the player picked in the period, most played first, with their number of matches. */
@Component({
  selector: 'app-agents-strip',
  imports: [AgentIcon],
  template: `
    @for (item of agents(); track item.agent) {
      <span class="inline-flex items-center gap-1.5 text-[0.95rem] text-text-secondary">
        <app-agent-icon [agent]="item.agent" size="sm" [decorative]="true" />
        {{ item.agent }} <span class="text-text-muted">{{ item.matches }}</span>
      </span>
    }
  `,
  host: { class: 'flex flex-wrap gap-2', role: 'group', 'aria-label': 'Agents joués' },
})
export class AgentsStrip {
  public readonly agents = input.required<AgentPlayed[]>();
}
