import { Component, computed, input } from '@angular/core';
import { LucideDynamicIcon, LucideUser, LucideUsers } from '@lucide/angular';

import { Badge } from '@shared/badge/badge';

import { FindingCard } from '../finding-card/finding-card';
import { FindingColumnView } from '../findings.model';

/**
 * One block of the view, weaknesses or strengths: a header with its count, then its groups (team,
 * players) side by side on wide screens, folded cards under a quiet divider, the block's costliest
 * card opened unless a link asked for another.
 */
@Component({
  selector: 'app-finding-column',
  imports: [Badge, FindingCard, LucideDynamicIcon],
  templateUrl: './finding-column.html',
  host: { class: 'flex min-w-0 flex-col border border-edge' },
})
export class FindingColumn {
  public readonly heading = input.required<string>();
  public readonly weak = input.required<boolean>();
  public readonly column = input.required<FindingColumnView>();
  /** Subject whose card opens and comes into view instead of the costliest one. */
  public readonly openKey = input<string | null>(null);
  public readonly playerAgents = input<Record<string, string>>({});

  protected readonly teamIcon = LucideUsers;
  protected readonly playerIcon = LucideUser;
  protected readonly countLabel = computed(() => String(this.column().count));
}
