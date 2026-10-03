import { Component, computed, input } from '@angular/core';

import { Badge } from '@shared/badge/badge';

import { FindingCard } from '../finding-card/finding-card';
import { FindingColumnView } from '../findings.model';

/**
 * One column of the view, weaknesses or strengths: a fixed header with its count, then each group's
 * cards in a block that scrolls on its own on wide screens.
 */
@Component({
  selector: 'app-finding-column',
  imports: [Badge, FindingCard],
  templateUrl: './finding-column.html',
  host: { class: 'flex min-h-0 min-w-0 flex-col border border-edge' },
})
export class FindingColumn {
  public readonly heading = input.required<string>();
  public readonly weak = input.required<boolean>();
  public readonly column = input.required<FindingColumnView>();
  public readonly playerAgents = input<Record<string, string>>({});

  protected readonly countLabel = computed(() => String(this.column().count));
}
