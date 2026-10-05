import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';

import { RosterLine } from '@core/report/squad.model';
import { AgentIcon } from '@shared/game-art/agent-icon';
import { HoverTip } from '@shared/hover-tip/hover-tip';
import { InfoTip } from '@shared/info-tip/info-tip';
import { Sparkline } from '@shared/sparkline/sparkline';

import { DASH_TEXTS } from '../squad.constants';
import { ROSTER_COLUMNS, ROSTER_GRID } from './roster-board.constants';
import { rosterRows } from './roster-board.utils';

/** One line per player: ACS month by month, then each figure against the top ranked, the detail in tips. */
@Component({
  selector: 'app-roster-board',
  imports: [AgentIcon, HoverTip, InfoTip, Sparkline],
  templateUrl: './roster-board.html',
  host: { class: 'block overflow-x-auto' },
})
export class RosterBoard {
  public readonly roster = input.required<readonly RosterLine[]>();
  /** 'de mai à septembre', for the ACS chart's column. */
  public readonly span = input('');
  /** Month labels aligned with each line's ACS months, for the chart's tip. */
  public readonly months = input<readonly string[]>([]);

  private readonly router = inject(Router);
  protected readonly rows = computed(() => rosterRows(this.roster(), this.months()));
  protected readonly tones = DASH_TEXTS;
  /** Column heads after the chart, with their glossary tips. */
  protected readonly heads = [
    ...(['acs', 'adr', 'kast', 'headshots', 'opening'] as const).map((key) => ({
      key,
      label: ROSTER_COLUMNS[key].label,
      help: ROSTER_COLUMNS[key].help ?? null,
    })),
    { key: 'duels', label: "Duels d'ouverture", help: null },
    { key: 'traded', label: ROSTER_COLUMNS.traded.label, help: ROSTER_COLUMNS.traded.help ?? null },
  ];
  protected readonly cols = ROSTER_GRID;

  protected open(name: string): void {
    void this.router.navigate(['/report/players', name], { queryParamsHandling: 'preserve' });
  }
}
