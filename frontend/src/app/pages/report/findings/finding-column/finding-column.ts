import { Component, computed, input } from '@angular/core';

import { FindingCard } from '../finding-card/finding-card';
import { FindingColumnView } from '../findings.model';

/** Gives each list its own heading id. */
let columnCount = 0;

/**
 * One list of the view, weaknesses or strengths: a heading with its count, then one folded line per
 * subject, the costliest first. Only the card a Résumé link asked for opens.
 */
@Component({
  selector: 'app-finding-column',
  imports: [FindingCard],
  templateUrl: './finding-column.html',
  host: { class: 'view-section min-w-0', '[attr.aria-labelledby]': 'headingId' },
})
export class FindingColumn {
  public readonly heading = input.required<string>();
  public readonly weak = input.required<boolean>();
  public readonly column = input.required<FindingColumnView>();
  /** Subject whose card opens and comes into view. */
  public readonly openKey = input<string | null>(null);
  public readonly playerAgents = input<Record<string, string>>({});

  protected readonly headingId = `findings-${++columnCount}`;
  protected readonly countLabel = computed(() => {
    const count = this.column().subjects.length;
    return `${count} sujet${count > 1 ? 's' : ''}`;
  });
}
