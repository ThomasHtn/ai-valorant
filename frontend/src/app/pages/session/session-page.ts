import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideChartColumn, LucideChevronLeft, LucideChevronRight } from '@lucide/angular';

import { longDay, monthTitle } from '@core/format/format.utils';
import { mapBanner } from '@core/game-assets/game-assets.utils';
import { SIDE_LABELS } from '@core/format/labels.constants';
import { resourceValue } from '@core/http/resource-state.utils';
import { SessionsApi } from '@core/sessions/sessions-api';
import { PageHeader } from '@layout/page-header/page-header';
import { Badge } from '@shared/badge/badge';
import { ResourceState } from '@shared/resource-state/resource-state';
import { RosterTable } from '@shared/roster-table/roster-table';
import { PickerTabs } from '@shared/tabs/picker-tabs';
import { PickerItem } from '@shared/tabs/tabs.model';

import { SessionMatchView } from './session-match/session-match';
import { EVENING_TAB } from './session-page.constants';
import { VersusUsual } from './versus-usual/versus-usual';

/** Session report: the evening as a whole, then one map banner per match; arrows to the other evenings. */
@Component({
  selector: 'app-session-page',
  imports: [
    RouterLink,
    LucideChartColumn,
    LucideChevronLeft,
    LucideChevronRight,
    PageHeader,
    Badge,
    ResourceState,
    RosterTable,
    PickerTabs,
    SessionMatchView,
    VersusUsual,
  ],
  host: { class: 'page-stack' },
  templateUrl: './session-page.html',
})
export class SessionPage {
  /** Route parameter: a `YYYY-MM-DD` day or `latest`. */
  public readonly day = input.required<string>();

  private readonly sessions = inject(SessionsApi);
  protected readonly report = this.sessions.report(computed(() => this.day()));

  protected readonly monthTitle = monthTitle;
  protected readonly sideLabels = SIDE_LABELS;
  protected readonly eveningTab = EVENING_TAB;

  protected readonly heading = computed(() => {
    const report = resourceValue(this.report, null);
    return report
      ? `Soirée du ${longDay(report.day).toLowerCase()} ${report.day.slice(0, 4)}`
      : 'Soirée';
  });

  /** The evening first, then each match as its map banner with the score. */
  protected readonly tabs = computed<PickerItem[]>(() => [
    { id: EVENING_TAB, label: 'Soirée' },
    ...(resourceValue(this.report, null)?.matches ?? []).map((m) => ({
      id: m.matchId,
      label: m.mapName,
      image: mapBanner(m.mapName),
      note: `${m.roundsWon}-${m.roundsLost}`,
      tone: m.roundsWon > m.roundsLost ? ('good' as const) : ('bad' as const),
    })),
  ]);

  /** Days of the evenings around this one; the list is newest first. */
  protected readonly neighbours = computed(() => {
    const days = (resourceValue(this.sessions.list, []) ?? []).map((s) => s.day);
    const current = resourceValue(this.report, null)?.day;
    const index = current ? days.indexOf(current) : -1;
    return {
      older: index >= 0 ? (days[index + 1] ?? null) : null,
      newer: index > 0 ? days[index - 1] : null,
    };
  });

  /** Back to the evening whenever another day opens. */
  protected readonly tab = linkedSignal<string, string | null>({
    source: this.day,
    computation: () => EVENING_TAB,
  });
}
