import { Component, input } from '@angular/core';

import { AgentIcon } from './agent-icon';

/** Portrait then name, for an agent column. */
@Component({
  selector: 'app-agent-name',
  imports: [AgentIcon],
  template: `<app-agent-icon [agent]="agent()" [decorative]="true" />{{ agent() }}`,
  host: { class: 'inline-flex items-center gap-2' },
})
export class AgentName {
  public readonly agent = input.required<string>();
}
