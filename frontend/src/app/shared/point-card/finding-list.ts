import { Component, computed, input } from '@angular/core';

import {
  findingBadges,
  findingDetails,
  findingRewatch,
  FindingSubject,
  findingValue,
  statusBadge,
} from '@core/periods/finding-format.utils';
import { Finding } from '@core/periods/findings.model';

import { PointCard } from './point-card';
import { PointCardContent } from './point-card.model';

/** A list of findings as rows, or a placeholder when there is none. */
@Component({
  selector: 'app-finding-list',
  imports: [PointCard],
  template: `
    @for (card of cards(); track $index) {
      <app-point-card
        [badges]="card.badges"
        [status]="card.status"
        [title]="card.title"
        [value]="card.value"
        [details]="card.details"
        [rewatch]="card.rewatch ?? []"
        [tone]="card.tone"
      />
    } @empty {
      <p class="muted">{{ empty() }}</p>
    }
  `,
})
export class FindingList {
  public readonly findings = input.required<Finding[]>();
  /** Reads a bare scope as a map (team) or a player name. */
  public readonly subject = input<FindingSubject>('team');
  public readonly empty = input('Rien de net sur cette période.');
  /** Scope already given by the page (the map of a map sheet), left out of the badges. */
  public readonly known = input<string | null>(null);

  protected readonly cards = computed<PointCardContent[]>(() =>
    this.findings().map((f) => ({
      badges: findingBadges(f, this.subject()).filter((b) => b.label !== this.known()),
      status: statusBadge(f.status),
      title: f.label,
      value: findingValue(f),
      details: findingDetails(f),
      rewatch: findingRewatch(f),
      tone: f.tone,
    })),
  );
}
