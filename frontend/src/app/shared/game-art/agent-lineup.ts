import { Component, input } from '@angular/core';

import { AgentIcon } from './agent-icon';

/** A composition as a row of portraits, each named on hover and for screen readers. */
@Component({
  selector: 'app-agent-lineup',
  imports: [AgentIcon],
  template: `
    @for (agent of agents(); track $index) {
      <app-agent-icon [agent]="agent" [size]="size()" />
    }
  `,
  host: { class: 'inline-flex items-center gap-1' },
})
export class AgentLineup {
  public readonly agents = input.required<string[]>();
  public readonly size = input<'sm' | 'md'>('sm');
}
