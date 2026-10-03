import { Component, computed, inject, signal } from '@angular/core';

import { resourceValue } from '@core/http/resource-state.utils';
import { ReportApi } from '@core/report/report-api';
import { ReportContext } from '@core/report/report-context';
import { ViewState } from '@core/report/view-state';
import { provideViewState } from '@core/report/view-states';
import { FilterBar } from '@shared/filter-bar/filter-bar';
import { InfoTip } from '@shared/info-tip/info-tip';
import { ResourceState } from '@shared/resource-state/resource-state';

import { FindingColumn } from './finding-column/finding-column';
import { filterFindings, findingColumn } from './findings-view.utils';

/**
 * Points forts et faibles: every gap of the period that passes a statistical test, weaknesses first
 * then strengths, one block under the other, each split between the team and its players.
 */
@Component({
  selector: 'app-findings-view',
  imports: [FilterBar, InfoTip, ResourceState, FindingColumn],
  host: { class: 'view-body' },
  providers: [provideViewState('findings')],
  templateUrl: './findings-view.html',
})
export class FindingsView {
  protected readonly context = inject(ReportContext);
  private readonly state = inject(ViewState);
  protected readonly report = inject(ReportApi).findings(this.context.query);

  /** "Écarts nets seulement": hides the gaps still to confirm. */
  protected readonly confirmedOnly = signal(false);

  protected readonly meta = computed(() => resourceValue(this.context.meta, null));
  protected readonly maps = computed(() => this.meta()?.maps ?? []);
  protected readonly players = computed(() => this.meta()?.players.map((p) => p.name) ?? []);

  private readonly visible = computed(() =>
    filterFindings(
      resourceValue(this.report, null)?.findings ?? [],
      this.state.filters(),
      this.confirmedOnly(),
    ),
  );
  protected readonly weaknesses = computed(() => findingColumn(this.visible(), 'weak'));
  protected readonly strengths = computed(() => findingColumn(this.visible(), 'strong'));

  protected toggleConfirmedOnly(event: Event): void {
    this.confirmedOnly.set((event.target as HTMLInputElement).checked);
  }
}
