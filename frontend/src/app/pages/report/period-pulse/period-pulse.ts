import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { integer } from '@core/format/value-format.utils';
import { resourceValue } from '@core/http/resource-state.utils';
import { periodForm } from '@core/report/period-form.utils';
import { periodQueryParams } from '@core/report/period-query.utils';
import { ReportContext } from '@core/report/report-context';
import { FormStrip } from '@shared/form-strip/form-strip';

/**
 * The period at a glance beside its title: the V-D record, the form strip of its matches (a link to
 * them) and its rounds.
 */
@Component({
  selector: 'app-period-pulse',
  imports: [RouterLink, FormStrip],
  template: `
    @if (meta(); as meta) {
      <p class="!m-0 flex items-center gap-x-4 whitespace-nowrap">
        <span class="font-display text-lg leading-none font-medium tabular-nums">
          <span class="text-rating-good">{{ meta.wins }}V</span>
          <span class="ml-1.5 text-rating-bad">{{ meta.losses }}D</span>
        </span>
        @if (form().length) {
          <a
            routerLink="/report/matches"
            [queryParams]="periodParams()"
            class="focus-ring hidden px-1 py-1 transition-colors hover:bg-text-primary/7 md:inline-flex"
            [attr.aria-label]="'Voir les ' + meta.matches + ' matchs de la période'"
          >
            <app-form-strip [matches]="form()" />
          </a>
        }
        <span class="hidden text-text-muted lg:inline">
          {{ meta.matches }} {{ meta.matches > 1 ? 'matchs' : 'match' }},
          {{ integer(meta.rounds) }} rounds
        </span>
      </p>
    }
  `,
  host: { class: 'flex min-w-0' },
})
export class PeriodPulse {
  private readonly context = inject(ReportContext);

  protected readonly meta = computed(() => resourceValue(this.context.meta, null));
  protected readonly form = computed(() => {
    const periods = resourceValue(this.context.periods, null);
    return periods ? periodForm(periods, this.context.query()) : [];
  });
  protected readonly periodParams = computed(() => periodQueryParams(this.context.query()));
  protected readonly integer = integer;
}
