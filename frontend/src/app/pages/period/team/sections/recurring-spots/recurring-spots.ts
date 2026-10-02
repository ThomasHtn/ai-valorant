import { Component, computed, input } from '@angular/core';

import { rewatchGroups, spotBadges, spotDetails } from '@core/periods/finding-format.utils';
import { RecurringSpot } from '@core/periods/findings.model';
import { PointCard } from '@shared/point-card/point-card';
import { PointCardContent } from '@shared/point-card/point-card.model';

/** Callouts where the squad keeps dying first. */
@Component({
  selector: 'app-recurring-spots',
  imports: [PointCard],
  template: `
    @for (card of cards(); track $index) {
      <app-point-card
        [badges]="card.badges"
        [title]="card.title"
        [value]="card.value"
        [details]="card.details"
        [rewatch]="card.rewatch ?? []"
        [tone]="card.tone"
      />
    } @empty {
      <p class="muted">Aucune position ne revient au moins 4 fois.</p>
    }
  `,
  host: { class: 'grid gap-x-3 lg:grid-cols-2' },
})
export class RecurringSpots {
  public readonly spots = input.required<RecurringSpot[]>();

  protected readonly cards = computed<PointCardContent[]>(() =>
    this.spots().map((s) => ({
      badges: spotBadges(s),
      status: null,
      title: `First deaths à ${s.callout}`,
      value: String(s.count),
      details: spotDetails(s),
      rewatch: rewatchGroups(s.rewatch),
      tone: 'bad',
    })),
  );
}
