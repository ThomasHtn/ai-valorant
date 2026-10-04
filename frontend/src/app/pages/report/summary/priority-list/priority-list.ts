import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Badge } from '@shared/badge/badge';
import { GapChip } from '@shared/gap-chip/gap-chip';
import { resolveArt } from '@shared/game-art/art.utils';
import { RowArt } from '@shared/game-art/row-art';

import { PriorityItem } from '../summary.model';

/**
 * Weaknesses or strengths of the summary, one line each: where, what, and the rounds at stake.
 * A line opens its card in Points forts et faibles, where the causes and rounds to rewatch are.
 */
@Component({
  selector: 'app-priority-list',
  imports: [Badge, GapChip, RouterLink, RowArt],
  templateUrl: './priority-list.html',
  host: { class: 'block' },
})
export class PriorityList {
  public readonly items = input.required<PriorityItem[]>();
  public readonly weak = input(true);
  public readonly playerAgents = input<Record<string, string>>({});

  protected readonly side = computed(() => (this.weak() ? 'weak' : 'strong'));
  protected readonly rows = computed(() =>
    this.items().map((item) => ({ ...item, art: resolveArt(item.art, this.playerAgents()) })),
  );
}
