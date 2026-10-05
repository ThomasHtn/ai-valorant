import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';

import { displayedGap, formatGap, formatValue } from '@core/format/value-format.utils';
import { RosterLine } from '@core/report/squad.model';
import { cellTone } from '@core/report/tone.utils';
import { ColHead } from '@shared/col-head/col-head';
import { AgentIcon } from '@shared/game-art/agent-icon';
import { RoleIcon } from '@shared/game-art/role-icon';
import { BAR_TEXTS } from '@shared/gap-bar/gap-bar.constants';

import { ROSTER_COLUMNS, RosterKey } from './roster-board.constants';

/** One line per player: each figure with its gap to the top ranked of his role, so a colour never stands alone. */
@Component({
  selector: 'app-roster-board',
  imports: [AgentIcon, ColHead, RoleIcon],
  templateUrl: './roster-board.html',
  host: { class: 'block overflow-x-auto' },
})
export class RosterBoard {
  public readonly roster = input.required<readonly RosterLine[]>();

  private readonly router = inject(Router);
  protected readonly columns = Object.values(ROSTER_COLUMNS);
  protected readonly tones = BAR_TEXTS;

  protected readonly rows = computed(() =>
    [...this.roster()]
      .sort((a, b) => Number(b.acs.v ?? 0) - Number(a.acs.v ?? 0))
      .map((line) => ({
        line,
        cells: this.columns.map((column) => {
          const cell = line[column.key as RosterKey];
          const value = typeof cell.v === 'number' ? cell.v : null;
          const top = typeof cell.top === 'number' ? cell.top : null;
          return {
            key: column.key,
            label: column.label,
            text: formatValue(value, column.format),
            tone: cellTone(cell, column, 'top') ?? 'small',
            gap:
              column.key === 'opening'
                ? line.openingRecord
                : value !== null && top !== null
                  ? formatGap(displayedGap(value, top, column.format), column.format)
                  : '',
          };
        }),
      })),
  );

  protected open(name: string): void {
    void this.router.navigate(['/report/players', name], { queryParamsHandling: 'preserve' });
  }
}
