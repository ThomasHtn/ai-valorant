import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideUsers } from '@lucide/angular';

import { Badge } from '@shared/badge/badge';
import { resolveArt } from '@shared/game-art/art.utils';
import { RowArt } from '@shared/game-art/row-art';
import { RoundsGap } from '@shared/rounds-gap/rounds-gap';

import { PriorityItem } from '../summary.model';

/**
 * Weaknesses or strengths of the summary, one line each: where, what against whom, and the rounds
 * at stake in words. A line opens its card in Points forts et faibles.
 */
@Component({
  selector: 'app-priority-list',
  imports: [Badge, LucideUsers, RouterLink, RoundsGap, RowArt],
  templateUrl: './priority-list.html',
  host: { class: 'block' },
})
export class PriorityList {
  public readonly items = input.required<PriorityItem[]>();
  public readonly weak = input(true);
  /** Largest gap of the Résumé in rounds: the length of a full bar. */
  public readonly scale = input(1);
  public readonly playerAgents = input<Record<string, string>>({});

  protected readonly side = computed(() => (this.weak() ? 'weak' : 'strong'));
  protected readonly rows = computed(() =>
    this.items().map((item) => ({
      ...item,
      art: resolveArt(item.art, this.playerAgents()),
      width: Math.max(2, Math.min(100, (Math.abs(item.gapRounds) / this.scale()) * 100)),
    })),
  );
}
