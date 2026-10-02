import { Component, computed, input } from '@angular/core';

import { SessionsContext as SessionsContextData } from '@core/periods/insights.model';
import { BarChart } from '@shared/chart/bar-chart';
import { ChartValueFormatter } from '@shared/chart/chart.model';
import { InfoTip } from '@shared/info-tip/info-tip';
import { MatchRecordCells } from '@shared/match-record-cells/match-record-cells';

import { CONTEXT_GROUPS, CONTEXT_MIN_MATCHES } from './sessions-context.constants';
import { contextBars } from './sessions-context.utils';

/** Results by rank of the match in the evening, start hour, weekday, lineup and presence of each player. */
@Component({
  selector: 'app-sessions-context',
  imports: [BarChart, InfoTip, MatchRecordCells],
  templateUrl: './sessions-context.html',
})
export class SessionsContext {
  public readonly context = input.required<SessionsContextData>();

  protected readonly minMatches = CONTEXT_MIN_MATCHES;
  protected readonly percentFormatter: ChartValueFormatter = (value) => `${Math.round(value)} %`;

  /** Built once per input: the charts must not receive a fresh array on every check. */
  protected readonly charts = computed(() =>
    CONTEXT_GROUPS.map((group) => {
      const bars = contextBars(this.context()[group.key]);
      return {
        title: group.title,
        bars,
        summary: bars.map((b) => `${b.label} : ${b.valueLabel}, ${b.detail}`).join('. '),
      };
    }),
  );
}
