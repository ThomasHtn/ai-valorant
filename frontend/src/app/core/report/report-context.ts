import { computed, inject, linkedSignal, Service } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';

import { resourceValue } from '@core/http/resource-state.utils';

import { PeriodQuery } from './period-query.model';
import { periodQueryFromParams, samePeriodQuery } from './period-query.utils';
import { ReportApi } from './report-api';

/** Path prefix of every report view. */
export const REPORT_ROOT = '/report';

/**
 * The period being read and what it covers, shared by the report header and its views so they read
 * the same request. The period comes from the URL on a report page and is remembered elsewhere.
 */
@Service()
export class ReportContext {
  private readonly router = inject(Router);
  private readonly api = inject(ReportApi);

  /** Current URL, refreshed after each navigation. */
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  public readonly isOpen = computed(() => this.url().startsWith(REPORT_ROOT));

  /** Period of the URL on a report page, the last one read otherwise (the latest month at first). */
  public readonly query = linkedSignal<{ open: boolean; url: string }, PeriodQuery>({
    source: () => ({ open: this.isOpen(), url: this.url() }),
    computation: (source, previous) =>
      source.open || !previous
        ? periodQueryFromParams(this.router.parseUrl(source.url).queryParams)
        : previous.value,
    equal: samePeriodQuery,
  });

  /** Report tree, for the period selector. */
  public readonly periods = this.api.periods;
  /** Header facts, filter options and data quality of the period. */
  public readonly meta = this.api.meta(this.query);

  /** Squad player name -> main agent, for the picture of player rows. */
  public readonly playerAgents = computed<Record<string, string>>(() =>
    Object.fromEntries(
      (resourceValue(this.meta, null)?.players ?? []).map((p) => [p.name, p.mainAgent]),
    ),
  );
}
