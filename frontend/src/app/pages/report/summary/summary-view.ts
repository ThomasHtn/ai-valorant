import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { resourceValue } from '@core/http/resource-state.utils';
import { ReportApi } from '@core/report/report-api';
import { ReportContext } from '@core/report/report-context';
import { ViewState } from '@core/report/view-state';
import { provideViewState } from '@core/report/view-states';
import { ResourceState } from '@shared/resource-state/resource-state';
import { StatTableView } from '@shared/stat-table/stat-table';
import { ToneLegend } from '@shared/tone-legend/tone-legend';

import { HeadlineTileView } from './headline-tile/headline-tile';
import { MapBars } from './map-bars/map-bars';
import { PriorityList } from './priority-list/priority-list';
import {
  COLUMN_LABELS,
  MAP_COLUMNS,
  PLAYER_COLUMNS,
  SUMMARY_STRENGTHS,
  SUMMARY_TABLES,
  SUMMARY_WEAKNESSES,
} from './summary.constants';
import { headlineTiles, pickColumns, priorityItems, relabelColumns } from './summary.utils';

/**
 * Résumé: what an analyst looks at first, on one screen. The period's headline figures, the
 * weaknesses costing the most rounds and the biggest strengths, then maps and players; each block
 * leads to the view holding the details. Built from the other views' endpoints.
 */
@Component({
  selector: 'app-summary-view',
  imports: [
    HeadlineTileView,
    MapBars,
    RouterLink,
    ResourceState,
    StatTableView,
    ToneLegend,
    PriorityList,
  ],
  host: { class: 'view-body' },
  providers: [provideViewState('summary')],
  templateUrl: './summary-view.html',
})
export class SummaryView {
  protected readonly context = inject(ReportContext);
  protected readonly state = inject(ViewState);
  private readonly api = inject(ReportApi);

  protected readonly results = this.api.tables(this.context.query, signal('results'));
  private readonly combat = this.api.tables(this.context.query, signal('combat'));
  protected readonly findings = this.api.findings(this.context.query);

  private readonly resultTables = computed(() => resourceValue(this.results, null)?.tables ?? []);
  private readonly mapsSource = computed(() => {
    const table = this.resultTables().find((t) => t.id === SUMMARY_TABLES.maps);
    return table ? relabelColumns(table, COLUMN_LABELS) : undefined;
  });

  protected readonly tiles = computed(() =>
    headlineTiles(
      this.mapsSource(),
      this.resultTables().find((t) => t.id === SUMMARY_TABLES.roundTypes),
      this.state.preferences().reference,
      this.context.historyLabel(),
    ),
  );
  protected readonly mapsTable = computed(() => {
    const table = this.mapsSource();
    return table ? pickColumns(table, MAP_COLUMNS) : null;
  });
  protected readonly playersTable = computed(() => {
    const table = resourceValue(this.combat, null)?.tables.find(
      (t) => t.id === SUMMARY_TABLES.players,
    );
    return table ? pickColumns(table, PLAYER_COLUMNS) : null;
  });

  private readonly allFindings = computed(() => resourceValue(this.findings, null)?.findings ?? []);
  protected readonly weaknesses = computed(() =>
    priorityItems(this.allFindings(), 'weak', SUMMARY_WEAKNESSES),
  );
  protected readonly strengths = computed(() =>
    priorityItems(this.allFindings(), 'strong', SUMMARY_STRENGTHS),
  );
  /** Biggest gap of both lists: the length of a full bar, so they compare at a glance. */
  protected readonly gapScale = computed(() =>
    Math.max(1, ...[...this.weaknesses(), ...this.strengths()].map((i) => Math.abs(i.gapRounds))),
  );
}
