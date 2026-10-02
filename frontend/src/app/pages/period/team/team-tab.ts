import { Component, computed, inject, input } from '@angular/core';

import { DEFAULT_TEAM_GROUP, TEAM_GROUPS } from '@core/navigation/period-nav.constants';
import { TeamGroupId } from '@core/navigation/period-nav.model';
import { PeriodsApi } from '@core/periods/periods-api';
import { InfoTip } from '@shared/info-tip/info-tip';
import { ResourceState } from '@shared/resource-state/resource-state';
import { RosterTable } from '@shared/roster-table/roster-table';
import { LinkTabs } from '@shared/tabs/link-tabs';
import { LinkTabItem } from '@shared/tabs/tabs.model';

import { PeriodContext } from '@core/periods/period-context';
import { Clutches } from './sections/clutches/clutches';
import { Compositions } from './sections/compositions/compositions';
import { Correlations } from './sections/correlations/correlations';
import { Economy } from './sections/economy/economy';
import { Evolution } from './sections/evolution/evolution';
import { FindingsColumns } from './sections/findings-columns/findings-columns';
import { FormSection } from './sections/form-section/form-section';
import { MapPool } from './sections/map-pool/map-pool';
import { Opening } from './sections/opening/opening';
import { RecurringSpots } from './sections/recurring-spots/recurring-spots';
import { RevengeMatrix } from './sections/revenge-matrix/revenge-matrix';
import { RoundDrivers } from './sections/round-drivers/round-drivers';
import { SessionsContext } from './sections/sessions-context/sessions-context';
import { Sites } from './sections/sites/sites';
import { Situations } from './sections/situations/situations';
import { SummaryBox } from './sections/summary-box/summary-box';
import { TeamKpis } from './sections/team-kpis/team-kpis';
import { TEAM_GROUP_ICONS, TEAM_SECTIONS } from './team-sections.constants';

/** Team tab: one part at a time (summary, findings, rounds…), picked from the URL. */
@Component({
  selector: 'app-team-tab',
  imports: [
    InfoTip,
    LinkTabs,
    ResourceState,
    RosterTable,
    SummaryBox,
    TeamKpis,
    FormSection,
    MapPool,
    FindingsColumns,
    RoundDrivers,
    Correlations,
    Economy,
    Opening,
    Situations,
    Sites,
    Clutches,
    RevengeMatrix,
    Compositions,
    SessionsContext,
    RecurringSpots,
    Evolution,
  ],
  templateUrl: './team-tab.html',
})
export class TeamTab {
  /** Route parameter (`/periods/team/:group`); the summary when absent or unknown. */
  public readonly group = input<string>();

  protected readonly report = inject(PeriodsApi).team(inject(PeriodContext).query);

  protected readonly groupTabs: LinkTabItem[] = TEAM_GROUPS.map((g) => ({
    id: g.id,
    label: g.label,
    icon: TEAM_GROUP_ICONS[g.id],
    link: ['/periods/team', g.id],
  }));

  protected readonly selectedGroup = computed<TeamGroupId>(() => {
    const id = this.group();
    return TEAM_GROUPS.find((g) => g.id === id)?.id ?? DEFAULT_TEAM_GROUP;
  });

  protected readonly sections = computed(() =>
    TEAM_SECTIONS.filter((s) => s.group === this.selectedGroup()),
  );
}
