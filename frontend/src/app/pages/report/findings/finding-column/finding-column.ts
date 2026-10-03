import { Component, input } from '@angular/core';

import { FindingCard } from '../finding-card/finding-card';
import { FindingColumnView } from '../findings.model';

/** One column of the view, weaknesses or strengths: its heading and count, then each group's cards. */
@Component({
  selector: 'app-finding-column',
  imports: [FindingCard],
  templateUrl: './finding-column.html',
  host: { class: 'flex min-w-0 flex-col gap-0.5' },
})
export class FindingColumn {
  public readonly heading = input.required<string>();
  public readonly weak = input.required<boolean>();
  public readonly column = input.required<FindingColumnView>();
  public readonly playerAgents = input<Record<string, string>>({});
}
