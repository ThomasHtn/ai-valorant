import { Component, computed, inject, input } from '@angular/core';

import { resourceValue } from '@core/http/resource-state.utils';
import { FindingSubject } from '@core/periods/finding-format.utils';
import { Finding } from '@core/periods/findings.model';
import { rankByImpact } from '@core/periods/match-impact.utils';
import { PeriodContext } from '@core/periods/period-context';
import { PointRow } from '@shared/point-row/point-row';
import { PointRowHead } from '@shared/point-row/point-row-head';
import { PointRowContent } from '@shared/point-row/point-row.model';

import { findingCard } from './finding-card.utils';

/** A list of findings as rows under one head naming the columns, or a placeholder when empty. */
@Component({
  selector: 'app-finding-list',
  imports: [PointRow, PointRowHead],
  template: `
    @if (rows().length) {
      <app-point-row-head />
    }
    @for (row of rows(); track $index) {
      <app-point-row
        [card]="row.card"
        [matches]="row.matches"
        [wording]="row.wording"
        [rewatch]="row.rewatch"
      />
    } @empty {
      <p class="muted">{{ empty() }}</p>
    }
  `,
  host: { class: 'block min-w-0' },
})
export class FindingList {
  public readonly findings = input.required<Finding[]>();
  /** Reads a bare scope as a map (team) or a player name. */
  public readonly subject = input<FindingSubject>('team');
  public readonly empty = input('Rien de net sur cette période.');
  /** Scope already given by the page (the map of a map sheet), left out of the badges. */
  public readonly known = input<string | null>(null);

  private readonly overview = inject(PeriodContext).overview;

  protected readonly rows = computed<PointRowContent[]>(() => {
    const players = resourceValue(this.overview, null)?.players ?? [];
    return this.findings().map((f) => ({
      card: findingCard(f, this.subject(), players, this.known()),
      matches: rankByImpact(f.matches, f.squad, f.reference),
      wording: { counted: f.counted, tries: f.tries },
      rewatch: f.rewatch,
    }));
  });
}
