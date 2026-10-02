import { Component, computed, inject, input } from '@angular/core';

import { resourceValue } from '@core/http/resource-state.utils';
import { SummaryItem } from '@core/periods/findings.model';
import { rankByImpact } from '@core/periods/match-impact.utils';
import { PeriodContext } from '@core/periods/period-context';
import { summaryCard } from '@shared/point-card/finding-card.utils';
import { PointRowContent } from '@shared/point-row/point-row.model';

import { SUMMARY_LEGEND } from './summary-box.constants';
import { SummaryColumn } from './summary-column/summary-column';

/**
 * "À retenir": the main weaknesses and the worst first-death spot on the left, the main strengths
 * on the right, each with its matches. An empty side is left out.
 */
@Component({
  selector: 'app-summary-box',
  imports: [SummaryColumn],
  template: `
    @if (weak().length || strong().length) {
      <!-- Says once what each figure is, for a player with no stats background. -->
      <p class="muted mb-4 max-w-4xl text-sm">{{ legend }}</p>
      <div class="columns">
        @if (weak().length) {
          <app-summary-column title="Points faibles" [rows]="weak()" />
        }
        @if (strong().length) {
          <app-summary-column title="Points forts" [rows]="strong()" />
        }
      </div>
    } @else {
      <p class="muted">Rien de net sur cette période.</p>
    }
  `,
  host: { class: 'block' },
})
export class SummaryBox {
  public readonly items = input.required<SummaryItem[]>();

  private readonly overview = inject(PeriodContext).overview;

  protected readonly legend = SUMMARY_LEGEND;

  private readonly rows = computed<PointRowContent[]>(() => {
    const players = resourceValue(this.overview, null)?.players ?? [];
    return this.items().map((item) => ({
      card: summaryCard(item, players),
      matches: rankByImpact(item.matches, item.squad, item.reference),
      wording: { counted: item.counted, tries: item.tries },
      rewatch: [],
    }));
  });

  protected readonly weak = computed(() => this.rows().filter((r) => r.card.tone !== 'good'));
  protected readonly strong = computed(() => this.rows().filter((r) => r.card.tone === 'good'));
}
