import { DOCUMENT } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideChevronLeft } from '@lucide/angular';

import { resourceValue } from '@core/http/resource-state.utils';
import { ReportApi } from '@core/report/report-api';
import { ReportContext } from '@core/report/report-context';
import { ReportOriginTracker } from '@core/report/report-origin';
import { ReportState } from '@core/report/report-state';
import { parseRoundParam } from '@core/report/round-ref.utils';
import { RoundQuery } from '@core/report/round-query.model';
import { ResourceState } from '@shared/resource-state/resource-state';

import { RoundCauses } from './round-causes/round-causes';
import { RoundFiltersView } from './round-filters/round-filters';
import { RoundList } from './round-list/round-list';
import { RoundSheetView } from './round-sheet/round-sheet';
import { ScopeChip } from './scope-chip/scope-chip';
import { DEFAULT_ROUND_FILTERS, ROUND_SORTS } from './rounds-filter.constants';
import { RoundFilters, RoundSort } from './rounds-filter.model';
import {
  causeCounts,
  filterMaps,
  filterRounds,
  matchLabel,
  queryScope,
  readRoundParams,
  roundParams,
  sortRounds,
} from './rounds-filter.utils';

/**
 * Rounds: why the squad loses its rounds (lost rounds by cause) and which ones to rewatch, then the
 * sheet of one round.
 * A click on a Tableaux cell arrives here with its row as a removable filter; other views link here
 * with filters in the URL ('?map=Split&side=def&preset=throws', '?match=<id>' from Matchs), which then
 * follows the list.
 */
@Component({
  selector: 'app-rounds-view',
  imports: [
    LucideChevronLeft,
    ResourceState,
    RoundCauses,
    RoundFiltersView,
    RoundList,
    RoundSheetView,
    RouterLink,
    ScopeChip,
  ],
  host: { class: 'view-body' },
  templateUrl: './rounds-view.html',
})
export class RoundsView {
  /** Route parameter: '<matchId>_<roundNumber>'; the first listed round without it. */
  public readonly round = input<string>();

  protected readonly context = inject(ReportContext);
  private readonly state = inject(ReportState);
  private readonly api = inject(ReportApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly originTracker = inject(ReportOriginTracker);

  /**
   * Filters and sort from the URL, else the map and side picked in the other views; a list limited
   * to one match ignores those, they could hide its rounds.
   */
  private readonly initial = readRoundParams(
    this.route.snapshot.queryParams,
    this.route.snapshot.queryParams['match']
      ? DEFAULT_ROUND_FILTERS
      : {
          ...DEFAULT_ROUND_FILTERS,
          map: this.state.filters().map,
          side: this.state.filters().side,
        },
  );
  protected readonly filters = signal<RoundFilters>(this.initial.filters);
  protected readonly sort = signal<RoundSort>(this.initial.sort);
  protected readonly sorts = ROUND_SORTS;
  /** Page the round was opened from, offered as a way back. */
  protected readonly origin = computed(() => {
    const origin = this.originTracker.origin();
    return origin ? { label: origin.label, link: this.router.parseUrl(origin.url) } : null;
  });
  /** Filter carried by a Tableaux cell click, through the router's navigation state. */
  protected readonly query = signal<RoundQuery | null>(this.readQuery());

  protected readonly index = this.api.rounds(this.context.query);
  protected readonly meta = computed(() => resourceValue(this.context.meta, null));
  protected readonly maps = computed(() => this.meta()?.maps ?? []);
  private readonly allRounds = computed(() => resourceValue(this.index, null)?.rounds ?? []);
  protected readonly matchLabel = computed(() =>
    matchLabel(this.allRounds(), this.filters().match),
  );
  protected readonly mapOptions = computed(() => filterMaps(this.allRounds()));
  private readonly scopes = computed(() => [queryScope(this.query(), this.maps())]);
  /** Causes of the rounds kept by every filter but the cause itself, so each bar stays clickable. */
  protected readonly causes = computed(() =>
    causeCounts(filterRounds(this.allRounds(), { ...this.filters(), cause: '' }, this.scopes())),
  );
  protected readonly rows = computed(() =>
    sortRounds(filterRounds(this.allRounds(), this.filters(), this.scopes()), this.sort()),
  );

  protected readonly selected = computed(() => {
    const fromUrl = parseRoundParam(this.round());
    const first = this.rows()[0];
    return fromUrl ?? (first ? { matchId: first.matchId, roundNumber: first.roundNumber } : null);
  });
  protected readonly sheet = this.api.roundSheet(this.selected);

  constructor() {
    // Keep the URL in step with the list so a round click (which rebuilds the view) keeps it.
    effect(() => {
      const queryParams = roundParams(this.filters(), this.sort());
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams,
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });
  }

  protected setMatch(match: string): void {
    this.filters.update((filters) => ({ ...filters, match }));
  }

  protected setCause(cause: RoundFilters['cause']): void {
    this.filters.update((filters) => ({ ...filters, cause }));
  }

  private readQuery(): RoundQuery | null {
    const fromNavigation = inject(Router).currentNavigation()?.extras.state?.['roundQuery'];
    const fromHistory = inject(DOCUMENT).defaultView?.history.state?.roundQuery;
    return (fromNavigation ?? fromHistory ?? null) as RoundQuery | null;
  }
}
