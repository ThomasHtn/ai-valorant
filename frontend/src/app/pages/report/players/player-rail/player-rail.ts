import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PlayerSummary } from '@core/report/players.model';
import { AgentIcon } from '@shared/game-art/agent-icon';
import { RoleIcon } from '@shared/game-art/role-icon';

import { roleLabel } from '../players.utils';

/**
 * Squad players of the period as a list on the left of the sheet, like the stat themes: portrait,
 * name and role. It stays in place while the sheet scrolls, so another player is one click away.
 */
@Component({
  selector: 'app-player-rail',
  imports: [RouterLink, AgentIcon, RoleIcon],
  template: `
    @for (item of items(); track item.name) {
      <a
        class="side-tab focus-ring-inset !py-1.5 !pl-2"
        [routerLink]="['/report/players', item.name]"
        queryParamsHandling="preserve"
        [attr.aria-current]="item.name === selected() ? 'page' : null"
      >
        <app-agent-icon [agent]="item.portrait" size="md" [decorative]="true" />
        <span class="flex min-w-0 flex-col leading-tight">
          <span class="truncate">{{ item.name }}</span>
          <small class="flex items-center gap-1 text-sm font-normal text-text-muted">
            <app-role-icon class="!size-3.5" [role]="item.roleKey" />{{ item.role }}
          </small>
        </span>
      </a>
    }
  `,
  host: { class: 'side-rail', role: 'navigation', 'aria-label': 'Joueur' },
})
export class PlayerRail {
  public readonly players = input.required<PlayerSummary[]>();
  /** Name of the player whose sheet is open. */
  public readonly selected = input<string | null>(null);

  protected readonly items = computed(() =>
    this.players().map((p) => ({
      name: p.name,
      portrait: p.portrait,
      roleKey: p.role,
      role: roleLabel(p.role),
    })),
  );
}
