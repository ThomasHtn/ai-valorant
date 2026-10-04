import { Component, computed, inject } from '@angular/core';

import { resourceValue } from '@core/http/resource-state.utils';
import { ReportApi } from '@core/report/report-api';
import { ReportContext } from '@core/report/report-context';
import { InfoTip } from '@shared/info-tip/info-tip';
import { ResourceState } from '@shared/resource-state/resource-state';

import { FindingColumn } from './finding-column/finding-column';
import { findingColumn } from './findings-view.utils';

/**
 * Points forts et faibles: every gap of the period that passes a statistical test, weaknesses first
 * then strengths, one block under the other, each split between the team and its players.
 */
@Component({
  selector: 'app-findings-view',
  imports: [InfoTip, ResourceState, FindingColumn],
  host: { class: 'view-body' },
  templateUrl: './findings-view.html',
})
export class FindingsView {
  protected readonly context = inject(ReportContext);
  protected readonly report = inject(ReportApi).findings(this.context.query);

  private readonly visible = computed(() => resourceValue(this.report, null)?.findings ?? []);
  protected readonly weaknesses = computed(() => findingColumn(this.visible(), 'weak'));
  protected readonly strengths = computed(() => findingColumn(this.visible(), 'strong'));
}
