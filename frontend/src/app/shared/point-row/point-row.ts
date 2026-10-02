import { Component, computed, input, signal } from '@angular/core';
import { LucideChevronRight } from '@lucide/angular';

import { RoundRef } from '@core/common/common.model';
import { FindingMatch, MatchWording } from '@core/periods/findings.model';
import { Badge } from '@shared/badge/badge';
import { InfoTip } from '@shared/info-tip/info-tip';
import { MatchLinks } from '@shared/match-links/match-links';
import { PointCardContent } from '@shared/point-card/point-card.model';

import { POINT_ROW_GRID_CLASS } from './point-row.constants';

/** Numbers the rows so each toggle names the list it opens. */
let nextRowId = 0;

/**
 * A point as one row: what it says and where, the squad's figure beside the references, then its
 * matches (and rounds to rewatch) folded in an accordion, each match opening its page.
 */
@Component({
  selector: 'app-point-row',
  imports: [Badge, InfoTip, LucideChevronRight, MatchLinks],
  templateUrl: './point-row.html',
  host: {
    class: `${POINT_ROW_GRID_CLASS} mb-1 border-l-2 border-edge-strong bg-text-primary/4 px-4 py-2.5`,
    '[class.!border-l-rating-good]': "card().tone === 'good'",
    '[class.!border-l-rating-bad]': "card().tone === 'bad'",
  },
})
export class PointRow {
  public readonly card = input.required<PointCardContent>();
  /** Matches of the point, the one that weighs most first. */
  public readonly matches = input<FindingMatch[]>([]);
  /** How each match's figure reads ('3 throws sur 5 rounds à 2 joueurs d'avance'). */
  public readonly wording = input<MatchWording | null>(null);
  /** Rounds to rewatch, shown on the line of their match. */
  public readonly rewatch = input<RoundRef[]>([]);

  protected readonly open = signal(false);
  protected readonly listId = `point-matches-${nextRowId++}`;
  protected readonly toggleLabel = computed(() => {
    const count = this.matches().length;
    if (this.open()) {
      return count > 1 ? 'Masquer les matchs' : 'Masquer le match';
    }
    const matches = count > 1 ? `Voir les ${count} matchs` : 'Voir le match';
    const rounds = this.rewatch().length;
    if (!rounds) {
      return matches;
    }
    return `${matches} et ${rounds} ${rounds > 1 ? 'rounds' : 'round'} à revoir`;
  });

  /** A map is named like any other place: the match list already shows its picture. */
  protected readonly place = computed(
    () => this.card().badges.find((b) => b.kind === 'map')?.label ?? this.card().place ?? null,
  );
  protected readonly scope = computed(() => this.card().badges.filter((b) => b.kind !== 'map'));
  protected readonly status = computed(() => this.card().status);
  protected readonly meta = computed(() => this.card().details.filter(Boolean).join(', '));
}
