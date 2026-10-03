import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { resourceValue } from '@core/http/resource-state.utils';
import { ReportApi } from '@core/report/report-api';
import { ReportContext } from '@core/report/report-context';
import { DEFAULT_DOMAIN, REPORT_DOMAINS } from '@core/report/report-domains.constants';
import { ReportState } from '@core/report/report-state';
import { RoundQuery } from '@core/report/round-query.model';
import { StatRow } from '@core/report/stat-table.model';
import { DisplayToggles } from '@shared/display-toggles/display-toggles';
import { FilterBar } from '@shared/filter-bar/filter-bar';
import { InfoTip } from '@shared/info-tip/info-tip';
import { ResourceState } from '@shared/resource-state/resource-state';
import { StatTableView } from '@shared/stat-table/stat-table';
import { StatCellClick } from '@shared/stat-table/stat-table.model';
import { rowText } from '@shared/stat-table/stat-table.utils';
import { ToneLegend } from '@shared/tone-legend/tone-legend';

import { DetectionsPanel } from './detections-panel/detections-panel';
import { detectionGroups } from './detections-panel/detections-panel.utils';
import { DETECTIONS_KEY } from './tables-view.constants';
import { scopeFilter } from './tables-view.utils';

/**
 * Tableaux: every metric of one domain of the dictionary as coloured tables, values only.
 * The domain list sits on the left, with the period's automatic detections as its first entry;
 * a cell click opens the Rounds view on the rounds behind it.
 */
@Component({
  selector: 'app-tables-view',
  imports: [
    RouterLink,
    FilterBar,
    DisplayToggles,
    ToneLegend,
    StatTableView,
    InfoTip,
    ResourceState,
    DetectionsPanel,
  ],
  templateUrl: './tables-view.html',
})
export class TablesView {
  /** Route parameter: domain key ('combat'); the default domain without it. */
  public readonly domain = input<string>();

  protected readonly context = inject(ReportContext);
  protected readonly state = inject(ReportState);
  private readonly router = inject(Router);

  protected readonly domains = REPORT_DOMAINS;
  protected readonly detectionsKey = DETECTIONS_KEY;
  protected readonly showDetections = computed(() => this.domain() === DETECTIONS_KEY);
  /** Domain whose tables are loaded; null while the detections are shown. */
  protected readonly domainKey = computed(() => {
    if (this.showDetections()) {
      return null;
    }
    const key = this.domain();
    return key && REPORT_DOMAINS.some((d) => d.key === key) ? key : DEFAULT_DOMAIN;
  });
  private readonly api = inject(ReportApi);
  protected readonly tables = this.api.tables(this.context.query, this.domainKey);
  /** Repetitions, gaps and links of the period, whatever the domain; loaded for the entry's count. */
  protected readonly detections = this.api.detections(this.context.query);
  protected readonly detectionCount = computed(() => {
    const value = resourceValue(this.detections, null);
    return value ? detectionGroups(value).reduce((n, group) => n + group.items.length, 0) : null;
  });

  protected readonly meta = computed(() => resourceValue(this.context.meta, null));
  protected readonly maps = computed(() => this.meta()?.maps ?? []);
  protected readonly players = computed(() => this.meta()?.players.map((p) => p.name) ?? []);

  /** Row filter of each table, by table id; prepared here so the template passes stable references. */
  protected readonly rowFilters = computed(() => {
    const filters = this.state.filters();
    const result = new Map<string, ((row: StatRow) => boolean) | null>();
    for (const table of resourceValue(this.tables, null)?.tables ?? []) {
      result.set(table.id, scopeFilter(table.rows, filters, this.maps(), this.players()));
    }
    return result;
  });

  /** Opens the Rounds view on the clicked figure; the filter travels in the navigation state. */
  protected openRounds(click: StatCellClick): void {
    const roundQuery: RoundQuery = {
      title: [click.table.title, click.row.label, click.row.sub, click.column.label]
        .filter(Boolean)
        .join(' · '),
      text: rowText(click.row),
    };
    void this.router.navigate(['/report/rounds'], {
      queryParamsHandling: 'preserve',
      state: { roundQuery },
    });
  }
}
