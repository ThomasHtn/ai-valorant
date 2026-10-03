import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { dayMonth } from '@core/format/format.utils';
import { roundLink } from '@core/report/round-ref.utils';

/**
 * Link to the sheet of one round, written '30/09 Split R14' (or a custom label), keeping the period.
 * Every round of the period has a sheet: it is built on demand from the match.
 */
@Component({
  selector: 'app-round-link',
  imports: [RouterLink],
  template: `<a [routerLink]="link()" queryParamsHandling="preserve" class="focus-ring">{{
    text()
  }}</a>`,
})
export class RoundLink {
  public readonly matchId = input.required<string>();
  public readonly roundNumber = input.required<number>();
  /** Evening day, for the default label. */
  public readonly day = input<string | null>(null);
  public readonly map = input<string | null>(null);
  /** Replaces the default label. */
  public readonly label = input<string | null>(null);

  protected readonly link = computed(() =>
    roundLink({ matchId: this.matchId(), roundNumber: this.roundNumber() }),
  );
  protected readonly text = computed(() => {
    const label = this.label();
    if (label) {
      return label;
    }
    const parts = [
      this.day() ? dayMonth(this.day() as string) : null,
      this.map(),
      `R${this.roundNumber()}`,
    ];
    return parts.filter(Boolean).join(' ');
  });
}
