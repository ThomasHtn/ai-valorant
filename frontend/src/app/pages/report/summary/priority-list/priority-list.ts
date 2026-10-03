import { Component, computed, input } from '@angular/core';

import { Badge } from '@shared/badge/badge';
import { resolveArt } from '@shared/game-art/art.utils';
import { RowArt } from '@shared/game-art/row-art';
import { RewatchLinks } from '@shared/rewatch-links/rewatch-links';

import { SUMMARY_REWATCH } from '../summary.constants';
import { PriorityItem } from '../summary.model';

/**
 * Weaknesses or strengths of the summary as dense rows: where and what, the squad against its
 * reference, the rounds at stake in big, then the rounds to rewatch.
 */
@Component({
  selector: 'app-priority-list',
  imports: [Badge, RowArt, RewatchLinks],
  templateUrl: './priority-list.html',
  host: { class: 'block' },
})
export class PriorityList {
  public readonly items = input.required<PriorityItem[]>();
  public readonly weak = input(true);
  public readonly playerAgents = input<Record<string, string>>({});

  protected readonly rewatchMax = SUMMARY_REWATCH;
  protected readonly rows = computed(() =>
    this.items().map((item) => ({ ...item, art: resolveArt(item.art, this.playerAgents()) })),
  );
}
