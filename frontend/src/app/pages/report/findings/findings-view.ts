import { Component, computed, inject, input } from '@angular/core';

import { resourceValue } from '@core/http/resource-state.utils';
import { ReportApi } from '@core/report/report-api';
import { ReportContext } from '@core/report/report-context';
import { InfoTip } from '@shared/info-tip/info-tip';
import { ResourceState } from '@shared/resource-state/resource-state';

import { FindingColumn } from './finding-column/finding-column';
import { findingColumn, openTarget } from './findings-view.utils';

/**
 * Points forts et faibles: every gap of the period that passes a statistical test, weaknesses first
 * then strengths, one block under the other, the team and its players side by side in each.
 * A Résumé line arrives with `?open=weak:<subject>` and opens that card.
 */
@Component({
  selector: 'app-findings-view',
  imports: [InfoTip, ResourceState, FindingColumn],
  host: { class: 'view-body' },
  templateUrl: './findings-view.html',
})
export class FindingsView {
  /** Query parameter: '<side>:<subject key>' of the card to open, from the Résumé. */
  public readonly open = input<string>();

  protected readonly context = inject(ReportContext);
  protected readonly target = computed(() => openTarget(this.open()));
  protected readonly report = inject(ReportApi).findings(this.context.query);

  private readonly visible = computed(() => resourceValue(this.report, null)?.findings ?? []);
  protected readonly weaknesses = computed(() => findingColumn(this.visible(), 'weak'));
  protected readonly strengths = computed(() => findingColumn(this.visible(), 'strong'));
}
