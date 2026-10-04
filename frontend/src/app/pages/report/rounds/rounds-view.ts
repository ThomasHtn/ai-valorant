import { DOCUMENT } from '@angular/common';
import { Component, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { resourceValue } from '@core/http/resource-state.utils';
import { ReportApi } from '@core/report/report-api';
import { ReportContext } from '@core/report/report-context';
import { RoundQuery } from '@core/report/round-query.model';
import { ResourceState } from '@shared/resource-state/resource-state';

import { BuyMatrix, MatrixPick } from './buy-matrix/buy-matrix';
import { CostlyMoments } from './costly-moments/costly-moments';
import { RoundCauses } from './round-causes/round-causes';
import { RoundFiltersView } from './round-filters/round-filters';
import { RoundList } from './round-list/round-list';
import { ScopeChip } from './scope-chip/scope-chip';
import { DEFAULT_ROUND_FILTERS, ROUND_SORTS, THROW_SORT_RESULTS } from './rounds-filter.constants';
import { RoundFilters, RoundSort } from './rounds-filter.model';
import {
  causeCounts,
  effectiveSort,
  filterMaps,
  filterRounds,
  matchLabel,
  queryScope,
  readRoundParams,
  roundParams,
  sortRounds,
} from './rounds-filter.utils';
import { CostlyMoment } from './rounds-overview.model';

/**
 * Rounds, the whole period at once: why rounds are lost (by cause), where (map, side and buy) and
 * at which moments of a match, then the rounds behind each figure. Every block narrows the list;
 * a round opens on its page under its match.
 * A click on a Stats par thème cell arrives here with its row as a removable filter; other views
 * link with filters in the URL ('?map=Split&side=def&preset=throws', '?match=<id>').
 */
@Component({
  selector: 'app-rounds-view',
  imports: [
    BuyMatrix,
    CostlyMoments,
    ResourceState,
    RoundCauses,
    RoundFiltersView,
    RoundList,
    ScopeChip,
  ],
  host: { class: 'view-body' },
  templateUrl: './rounds-view.html',
})
export class RoundsView {
  protected readonly context = inject(ReportContext);
  private readonly api = inject(ReportApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly listTitle = viewChild<ElementRef<HTMLElement>>('listTitle');

  /** Filters and sort from the URL only: what another view filtered never narrows this list. */
  private readonly initial = readRoundParams(
    this.route.snapshot.queryParams,
    DEFAULT_ROUND_FILTERS,
  );
  protected readonly filters = signal<RoundFilters>(this.initial.filters);
  protected readonly sort = signal<RoundSort>(this.initial.sort);
  protected readonly sorts = ROUND_SORTS;
  /** The throw sort only applies to lists of lost rounds; elsewhere the list keeps the date order. */
  protected readonly appliedSort = computed(() =>
    effectiveSort(this.filters().result, this.sort()),
  );
  protected readonly canSort = computed(() => THROW_SORT_RESULTS.includes(this.filters().result));
  /** Filter carried by a Stats par thème cell click, through the router's navigation state. */
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
  /** Rounds in the match, map and side chosen, whatever their result: what the moments sum up. */
  protected readonly momentRounds = computed(() =>
    filterRounds(
      this.allRounds(),
      { ...DEFAULT_ROUND_FILTERS, result: 'all', ...this.placeFilters() },
      this.scopes(),
    ),
  );
  /** The matrix shows both sides, so only the match and the map narrow it. */
  protected readonly matrixRounds = computed(() =>
    filterRounds(
      this.allRounds(),
      {
        ...DEFAULT_ROUND_FILTERS,
        result: 'all',
        match: this.filters().match,
        map: this.filters().map,
      },
      [],
    ),
  );
  /** Causes of the rounds kept by every filter but the cause itself, so each ring stays clickable. */
  protected readonly causes = computed(() =>
    causeCounts(filterRounds(this.allRounds(), { ...this.filters(), cause: '' }, this.scopes())),
  );
  protected readonly rows = computed(() =>
    sortRounds(filterRounds(this.allRounds(), this.filters(), this.scopes()), this.appliedSort()),
  );
  /** Moment line matching the filters, highlighted in its block. */
  protected readonly selectedMoment = computed<CostlyMoment['key'] | null>(() => {
    const f = this.filters();
    if (f.moment) {
      return f.moment;
    }
    if (f.result === 'thrown') {
      return 'throws';
    }
    return f.buy === 'pistol' && f.result === 'all' ? 'pistols' : null;
  });

  constructor() {
    // Keep the URL in step with the filters, so a round opened and left brings them back.
    effect(() => {
      const queryParams = roundParams(this.filters(), this.appliedSort());
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

  /** A matrix cell lists the lost rounds of its map, side and buy. */
  protected pickCell(pick: MatrixPick): void {
    this.filters.update((f) => ({
      ...f,
      map: pick.map,
      side: pick.side,
      buy: pick.buy,
      result: 'lost',
      cause: '',
      moment: '',
    }));
    this.showList();
  }

  /** A moment lists its rounds; picking it again goes back to the lost rounds. */
  protected pickMoment(key: CostlyMoment['key']): void {
    const reset = { ...this.filters(), cause: '' as const, buy: '' as const, moment: '' as const };
    if (key === this.selectedMoment()) {
      this.filters.set({ ...reset, result: 'lost' });
      return;
    }
    switch (key) {
      case 'throws':
        this.filters.set({ ...reset, result: 'thrown' });
        break;
      case 'pistols':
        this.filters.set({ ...reset, result: 'all', buy: 'pistol' });
        break;
      default:
        this.filters.set({ ...reset, result: 'all', moment: key });
    }
    this.showList();
  }

  private placeFilters(): Pick<RoundFilters, 'match' | 'map' | 'side'> {
    const { match, map, side } = this.filters();
    return { match, map, side };
  }

  private showList(): void {
    this.listTitle()?.nativeElement.scrollIntoView({ block: 'start' });
  }

  private readQuery(): RoundQuery | null {
    const fromNavigation = inject(Router).currentNavigation()?.extras.state?.['roundQuery'];
    const fromHistory = inject(DOCUMENT).defaultView?.history.state?.roundQuery;
    return (fromNavigation ?? fromHistory ?? null) as RoundQuery | null;
  }
}
