import { Component, computed, inject, signal } from '@angular/core';

import { resourceValue } from '@core/http/resource-state.utils';
import { ReportApi } from '@core/report/report-api';
import { ReportContext } from '@core/report/report-context';
import { DEFAULT_DOMAIN, REPORT_DOMAINS } from '@core/report/report-domains.constants';
import { ReportState } from '@core/report/report-state';
import { DataQuality } from '@shared/data-quality/data-quality';
import { FilterBar } from '@shared/filter-bar/filter-bar';
import { ResourceState } from '@shared/resource-state/resource-state';

import { scopeFilter } from '../tables/tables-view.utils';
import { COMPARE_COHORTS, COMPARE_MODES } from './compare.constants';
import { CompareCohort, CompareMode, CompareOption } from './compare.model';
import { playerGroups, teamGroups } from './compare.utils';
import { CompareTable } from './compare-table/compare-table';
import { SelectionBox } from './selection-box/selection-box';

const COHORT_OPTIONS: CompareOption[] = Object.entries(COMPARE_COHORTS).map(([value, label]) => ({
  value,
  label,
}));

/**
 * Comparateur: the metrics of one domain for two selections side by side, either two teams or
 * periods read in the same cells (squad, history, opponents, top ranked), or two squad players.
 */
@Component({
  selector: 'app-compare-view',
  imports: [FilterBar, DataQuality, ResourceState, SelectionBox, CompareTable],
  templateUrl: './compare-view.html',
})
export class CompareView {
  protected readonly context = inject(ReportContext);
  private readonly state = inject(ReportState);

  protected readonly modes = COMPARE_MODES;
  protected readonly domains = REPORT_DOMAINS;
  protected readonly cohortOptions = COHORT_OPTIONS;

  protected readonly mode = signal<CompareMode>('team');
  protected readonly domain = signal<string>(DEFAULT_DOMAIN);
  protected readonly cohortA = signal<CompareCohort>('squad');
  protected readonly cohortB = signal<CompareCohort>('hist');
  /** Chosen players; empty means the first (A) or second (B) player of the period. */
  private readonly chosenA = signal('');
  private readonly chosenB = signal('');

  protected readonly tables = inject(ReportApi).tables(this.context.query, this.domain);

  protected readonly meta = computed(() => resourceValue(this.context.meta, null));
  protected readonly maps = computed(() => this.meta()?.maps ?? []);
  protected readonly players = computed(() => this.meta()?.players.map((p) => p.name) ?? []);
  protected readonly playerOptions = computed<CompareOption[]>(() =>
    this.players().map((name) => ({ value: name, label: name })),
  );
  protected readonly playerA = computed(() => this.chosenA() || this.players()[0] || '');
  protected readonly playerB = computed(() => this.chosenB() || this.players()[1] || '');

  protected readonly groups = computed(() => {
    const domain = resourceValue(this.tables, null);
    if (!domain) {
      return [];
    }
    if (this.mode() === 'players') {
      return playerGroups(domain, this.playerA(), this.playerB());
    }
    // Map and side filters only: the player filter has no meaning when reading team cells.
    const filters = { ...this.state.filters(), player: '' };
    const keepByTable = new Map(
      domain.tables.map((t) => [t.id, scopeFilter(t.rows, filters, this.maps(), this.players())]),
    );
    return teamGroups(domain, this.cohortA(), this.cohortB(), (id) => keepByTable.get(id) ?? null);
  });

  protected setDomain(event: Event): void {
    this.domain.set((event.target as HTMLSelectElement).value);
  }

  protected setA(value: string): void {
    if (this.mode() === 'team') {
      this.cohortA.set(value as CompareCohort);
    } else {
      this.chosenA.set(value);
    }
  }

  protected setB(value: string): void {
    if (this.mode() === 'team') {
      this.cohortB.set(value as CompareCohort);
    } else {
      this.chosenB.set(value);
    }
  }
}
