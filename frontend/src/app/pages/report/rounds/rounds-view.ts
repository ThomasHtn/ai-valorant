import { DOCUMENT } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideX } from '@lucide/angular';

import { resourceValue } from '@core/http/resource-state.utils';
import { ReportApi } from '@core/report/report-api';
import { ReportContext } from '@core/report/report-context';
import { ReportState } from '@core/report/report-state';
import { parseRoundParam } from '@core/report/round-ref.utils';
import { RoundQuery } from '@core/report/round-query.model';
import { FilterBar } from '@shared/filter-bar/filter-bar';
import { DataQuality } from '@shared/data-quality/data-quality';
import { ResourceState } from '@shared/resource-state/resource-state';

import { RoundFiltersView } from './round-filters/round-filters';
import { RoundList } from './round-list/round-list';
import { RoundSheetView } from './round-sheet/round-sheet';
import { DEFAULT_ROUND_FILTERS } from './rounds-filter.constants';
import { RoundFilters } from './rounds-filter.model';
import { filterOptions, filterRounds, queryScope } from './rounds-filter.utils';

/**
 * Rounds: every round of the period behind a figure, with filters, then the sheet of one round.
 * A click on a Tableaux cell arrives here with its row as a removable filter.
 */
@Component({
  selector: 'app-rounds-view',
  imports: [
    DataQuality,
    FilterBar,
    LucideX,
    ResourceState,
    RoundFiltersView,
    RoundList,
    RoundSheetView,
  ],
  templateUrl: './rounds-view.html',
})
export class RoundsView {
  /** Route parameter: '<matchId>_<roundNumber>'; the first listed round without it. */
  public readonly round = input<string>();

  protected readonly context = inject(ReportContext);
  private readonly state = inject(ReportState);
  private readonly api = inject(ReportApi);

  protected readonly filters = signal<RoundFilters>(DEFAULT_ROUND_FILTERS);
  /** Filter carried by a Tableaux cell click, through the router's navigation state. */
  protected readonly query = signal<RoundQuery | null>(this.readQuery());

  protected readonly index = this.api.rounds(this.context.query);
  protected readonly meta = computed(() => resourceValue(this.context.meta, null));
  protected readonly maps = computed(() => this.meta()?.maps ?? []);
  private readonly allRounds = computed(() => resourceValue(this.index, null)?.rounds ?? []);
  protected readonly options = computed(() => filterOptions(this.allRounds()));
  protected readonly rows = computed(() => {
    const report = this.state.filters();
    return filterRounds(this.allRounds(), this.filters(), [
      queryScope(this.query(), this.maps()),
      { map: report.map, side: report.side },
    ]);
  });

  protected readonly selected = computed(() => {
    const fromUrl = parseRoundParam(this.round());
    const first = this.rows()[0];
    return fromUrl ?? (first ? { matchId: first.matchId, roundNumber: first.roundNumber } : null);
  });
  protected readonly sheet = this.api.roundSheet(this.selected);

  private readQuery(): RoundQuery | null {
    const fromNavigation = inject(Router).currentNavigation()?.extras.state?.['roundQuery'];
    const fromHistory = inject(DOCUMENT).defaultView?.history.state?.roundQuery;
    return (fromNavigation ?? fromHistory ?? null) as RoundQuery | null;
  }
}
