import { Component, input } from '@angular/core';

import { ColHead } from '@shared/col-head/col-head';
import { AgentIcon } from '@shared/game-art/agent-icon';
import { RoleIcon } from '@shared/game-art/role-icon';

import { CompRow } from '../strategy.model';

/** The top ranked's most played compos, then the squad's, each agent with its role glyph. */
@Component({
  selector: 'app-comp-board',
  imports: [AgentIcon, ColHead, RoleIcon],
  template: `
    <table class="board board-stack">
      <thead>
        <tr>
          <th appColHead label="Compo"></th>
          <th appColHead label="Part des matchs" help="compShare"></th>
          <th appColHead label="Rounds gagnés" align="end"></th>
          <th appColHead label="Matchs" align="end"></th>
        </tr>
      </thead>
      <tbody>
        @for (row of rows(); track row.key) {
          <tr [class.is-mine]="row.mine">
            <td>
              <span class="flex items-center gap-3">
                <span
                  class="w-12 shrink-0 font-display font-semibold"
                  [class]="row.mine ? 'text-brand-400' : 'text-text-muted'"
                  >{{ row.mine ? 'Vous' : 'N° ' + row.rank }}</span
                >
                <span class="flex gap-0.5">
                  @for (agent of row.agents; track agent.name) {
                    <span
                      class="relative block"
                      [class]="
                        agent.differs ? 'outline-2 -outline-offset-2 outline-rating-bad' : ''
                      "
                      [title]="
                        agent.differs ? agent.name + ' : absent de la compo n° 1' : agent.name
                      "
                    >
                      <app-agent-icon [agent]="agent.name" size="md" />
                      <app-role-icon
                        class="absolute right-0.5 bottom-0.5 !size-3 drop-shadow-[0_0_2px_#000]"
                        [role]="agent.role"
                      />
                    </span>
                  }
                </span>
              </span>
            </td>
            <td data-l="Part des matchs">
              @if (row.mine) {
                <span class="text-sm text-text-muted">votre compo la plus jouée</span>
              } @else {
                <span class="flex min-w-32 items-center gap-3">
                  <span class="relative h-2 flex-1 bg-surface-sunken/70">
                    <span
                      class="absolute inset-y-0 left-0 bg-brand-500"
                      [style.width.%]="row.share * 100 * scale()"
                    ></span>
                  </span>
                  <b class="w-12 text-right font-display font-semibold">{{ row.shareText }}</b>
                </span>
              }
            </td>
            <td class="num" data-l="Rounds gagnés">
              <span class="font-display font-semibold" [class.text-text-muted]="row.mine">{{
                row.rounds
              }}</span>
              @if (row.mine) {
                <span class="block text-sm text-text-muted">contre vos adversaires</span>
              }
            </td>
            <td class="num" data-l="Matchs">{{ row.matches }}</td>
          </tr>
        }
      </tbody>
    </table>
  `,
  host: { class: 'block overflow-x-auto' },
})
export class CompBoard {
  public readonly rows = input.required<readonly CompRow[]>();
  /** Stretch of the share bars: the most played compo fills a quarter of them at 25 %. */
  public readonly scale = input(4);
}
