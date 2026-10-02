import { computed, inject, linkedSignal, Service } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';

import { PeriodsApi } from './periods-api';
import { PeriodQuery } from './period-query.model';
import { periodQueryFromParams, samePeriodQuery } from './period-query.utils';

/**
 * The period being read and its overview, shared by the report's header and tabs so they read the
 * same request. The period comes from the URL on a `/periods` page and is remembered elsewhere.
 */
@Service()
export class PeriodContext {
  private readonly router = inject(Router);

  /** Current URL, refreshed after each navigation. */
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  public readonly isOpen = computed(() => this.url().startsWith('/periods'));

  /** Period of the URL on a report page, the last one read otherwise (the default month at first). */
  public readonly query = linkedSignal<{ open: boolean; url: string }, PeriodQuery>({
    source: () => ({ open: this.isOpen(), url: this.url() }),
    computation: (source, previous) =>
      source.open || !previous
        ? periodQueryFromParams(this.router.parseUrl(source.url).queryParams)
        : previous.value,
    equal: samePeriodQuery,
  });

  public readonly overview = inject(PeriodsApi).overview(this.query);
}
