import { Component, computed, inject, signal } from '@angular/core';

import { resourceValue } from '@core/http/resource-state.utils';
import { ReportApi } from '@core/report/report-api';
import { ReportContext } from '@core/report/report-context';
import { DEFAULT_DOMAIN, REPORT_DOMAINS } from '@core/report/report-domains.constants';
import { ViewState } from '@core/report/view-state';
import { provideViewState } from '@core/report/view-states';
import { FilterBar } from '@shared/filter-bar/filter-bar';
import { ResourceState } from '@shared/resource-state/resource-state';

import { ProfileRadar } from '../players/profile-radar/profile-radar';
import { RadarSeries } from '../players/profile-radar/profile-radar.model';
import { radarStats } from '../players/profile-radar/profile-radar.utils';
import { scopeFilter } from '../tables/tables-view.utils';
import { COMPARE_COHORTS, COMPARE_MODES, COMPARE_SORTS } from './compare.constants';
import { CompareCohort, CompareMode, CompareOption, CompareSort } from './compare.model';
import { arrangeGroups, playerGroups, teamGroups } from './compare.utils';
import { CompareTable } from './compare-table/compare-table';
import { SelectionBox } from './selection-box/selection-box';

const COHORT_OPTIONS: CompareOption[] = Object.entries(COMPARE_COHORTS).map(([value, label]) => ({
  value,
  label,
}));

/**
 * Comparateur: the metrics of one domain for two selections side by side, either two teams or
 * periods read in the same cells (squad, history, opponents, top ranked), or two squad players, whose
 * profiles then overlap on one radar.
 * Lines follow the domain's tables or come biggest gap first, optionally only the gaps that hold.
 */
@Component({
  selector: 'app-compare-view',
  imports: [FilterBar, ResourceState, SelectionBox, CompareTable, ProfileRadar],
  // Narrow centred column: four short columns would otherwise sit far from their labels.
  host: { class: 'view-body mx-auto w-full max-w-[64rem]' },
  providers: [provideViewState('compare')],
  templateUrl: './compare-view.html',
})
export class CompareView {
  protected readonly context = inject(ReportContext);
  private readonly state = inject(ViewState);

  protected readonly modes = COMPARE_MODES;
  protected readonly sorts = COMPARE_SORTS;
  protected readonly domains = REPORT_DOMAINS;
  protected readonly cohortOptions = COHORT_OPTIONS;

  protected readonly mode = signal<CompareMode>('team');
  protected readonly domain = signal<string>(DEFAULT_DOMAIN);
  protected readonly cohortA = signal<CompareCohort>('squad');
  protected readonly cohortB = signal<CompareCohort>('hist');
  protected readonly sort = signal<CompareSort>('tables');
  /** Hide the gaps that can come from chance. */
  protected readonly netOnly = signal(false);
  /** Chosen players; empty means the first (A) or second (B) player of the period. */
  private readonly chosenA = signal('');
  private readonly chosenB = signal('');

  private readonly api = inject(ReportApi);
  protected readonly tables = this.api.tables(this.context.query, this.domain);

  protected readonly meta = computed(() => resourceValue(this.context.meta, null));
  protected readonly maps = computed(() => this.meta()?.maps ?? []);
  protected readonly players = computed(() => this.meta()?.players.map((p) => p.name) ?? []);
  protected readonly playerOptions = computed<CompareOption[]>(() =>
    this.players().map((name) => ({ value: name, label: name })),
  );
  protected readonly playerA = computed(() => this.chosenA() || this.players()[0] || '');
  protected readonly playerB = computed(() => this.chosenB() || this.players()[1] || '');

  /** Both player sheets, fetched only when comparing players, for the radar. */
  private readonly sheetA = this.api.player(
    this.context.query,
    computed(() => (this.mode() === 'players' ? this.playerA() || null : null)),
  );
  private readonly sheetB = this.api.player(
    this.context.query,
    computed(() => (this.mode() === 'players' ? this.playerB() || null : null)),
  );
  /** Each player against players of his role, opponents of the same matches by default. */
  protected readonly radarReference = computed(() => this.state.preferences().reference);
  /** Player A in the squad blue, B in orange, the colours of their selection boxes. */
  protected readonly radarSeries = computed<RadarSeries[]>(() => {
    const a = resourceValue(this.sheetA, null);
    const b = resourceValue(this.sheetB, null);
    if (!a || !b || a.name === b.name) {
      return [];
    }
    return [
      { name: a.name, stats: radarStats(a.headline, a.openingDuels), colour: 'var(--color-squad)' },
      {
        name: b.name,
        stats: radarStats(b.headline, b.openingDuels),
        colour: 'var(--color-opponent)',
      },
    ];
  });

  protected readonly groups = computed(() =>
    arrangeGroups(this.allGroups(), this.sort(), this.netOnly()),
  );
  /** Something to compare before the net-only filter, to tell an empty domain from a quiet one. */
  protected readonly hasLines = computed(() => this.allGroups().length > 0);

  private readonly allGroups = computed(() => {
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
